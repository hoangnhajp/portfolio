# Sinh du lieu ban do cho 2 trang JILNESTA (#sales-jil-hcm, #sales-jil-offshore) -> tools/jil/map.json.
# Nguon ranh gioi that: GADM 4.1 cap huyen Viet Nam (gadm41_VNM_2.json, ranh gioi quan TP.HCM truoc 2025, dung voi
# giai doan 2017-2022) va Natural Earth 10m quoc gia (ne_10m_admin_0_countries.geojson). File nguon nang, KHONG de trong repo:
#   python -I tools/jil/mapdata.py <gadm41_VNM_2.json> <ne_10m_admin_0_countries.geojson> tools/jil/map.json
# Phep chieu giong #sales-map: x = (lon - lon0) * cos(lat_c) * k, y = (lat1 - lat) * k.
import json, math, sys

G = json.load(open(sys.argv[1], encoding='utf8'))
NE = json.load(open(sys.argv[2], encoding='utf8'))
C = {f['properties'].get('ADM0_A3'): f['geometry'] for f in NE['features']}


def polys(g):
    return g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]


def clip(ring, x0, y0, x1, y1):
    def cut(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            ia, ib = inside(a), inside(b)
            if ib:
                if not ia: out.append(inter(a, b))
                out.append(b)
            elif ia: out.append(inter(a, b))
        return out
    ix = lambda xc: (lambda a, b: (xc, a[1] + (b[1] - a[1]) * (xc - a[0]) / (b[0] - a[0])))
    iy = lambda yc: (lambda a, b: (a[0] + (b[0] - a[0]) * (yc - a[1]) / (b[1] - a[1]), yc))
    p = ring
    for ins, it in ((lambda q: q[0] >= x0, ix(x0)), (lambda q: q[0] <= x1, ix(x1)),
                    (lambda q: q[1] >= y0, iy(y0)), (lambda q: q[1] <= y1, iy(y1))):
        if not p: break
        p = cut(p, ins, it)
    return p


def dp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1e-9
    imax, dmax = 0, -1
    for i in range(1, len(pts) - 1):
        d = abs(dy * (pts[i][0] - a[0]) - dx * (pts[i][1] - a[1])) / L
        if d > dmax: imax, dmax = i, d
    if dmax <= eps: return [a, b]
    return dp(pts[:imax + 1], eps)[:-1] + dp(pts[imax:], eps)


def area(p):
    return abs(sum(p[i - 1][0] * p[i][1] - p[i][0] * p[i - 1][1] for i in range(len(p)))) / 2


class Frame:
    def __init__(s, lon0, lon1, lat0, lat1, W):
        s.lon0, s.lat1 = lon0, lat1
        s.c = math.cos(math.radians((lat0 + lat1) / 2))
        s.k = W / ((lon1 - lon0) * s.c)
        s.W, s.H = W, round((lat1 - lat0) * s.k, 1)

    def xy(s, lat, lon):
        return ((lon - s.lon0) * s.c * s.k, (s.lat1 - lat) * s.k)

    def pct(s, lat, lon):
        x, y = s.xy(lat, lon)
        return [round(x / s.W * 100, 2), round(y / s.H * 100, 2)]

    def path(s, geoms, eps, minarea, skip=None):
        out = []
        for g in geoms:
            for poly in polys(g):
                ring = poly[0]
                if skip and skip(ring): continue
                pts = [s.xy(lat, lon) for lon, lat in ring]
                pts = clip(pts, -2, -2, s.W + 2, s.H + 2)
                if len(pts) < 3: continue
                h = len(pts) // 2
                pts = dp(pts[:h + 1], eps)[:-1] + dp(pts[h:] + [pts[0]], eps)
                if len(pts) < 4 or area(pts) < minarea: continue
                out.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts[:-1]) + 'Z')
        return ''.join(out)


def arc(F, a, b, n_per=9, lift=.3, side=1):
    # cung bezier bac 2 uon sang 1 phia (side +1 / -1); cham bat dau cach diem dau 8 don vi, mui ten dung cach diem den 9
    (x0, y0), (x1, y1) = F.xy(*a), F.xy(*b)
    dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy)
    px, py = -dy / L * side, dx / L * side
    cx, cy = (x0 + x1) / 2 + px * lift * L, (y0 + y1) / 2 + py * lift * L
    B = lambda t: ((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1)
    te = 1.0
    while te > .5 and math.hypot(B(te)[0] - x1, B(te)[1] - y1) < 9: te -= .002
    ts = 0.0
    while ts < .4 and math.hypot(B(ts)[0] - x0, B(ts)[1] - y0) < 8: ts += .002
    n = max(5, int(L / n_per))
    dots = [[round(v, 1) for v in B(ts + i / n * (te - .04 - ts))] for i in range(1, n)]
    t = te; ex, ey = B(t)
    tx, ty = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy)
    return {'d': f'M{x0:.1f},{y0:.1f}Q{cx:.1f},{cy:.1f} {x1:.1f},{y1:.1f}', 'dots': dots,
            'head': [round(ex, 1), round(ey, 1), round(math.degrees(math.atan2(ty, tx)), 1)]}


HCM_ID = next(f['properties']['GID_1'] for f in G['features'] if 'Minh' in f['properties']['NAME_1'])
hcm = [f['geometry'] for f in G['features'] if f['properties']['GID_1'] == HCM_ID]
other = [f['geometry'] for f in G['features'] if f['properties']['GID_1'] != HCM_ID]

# 1) TP.HCM: toan thanh pho (trai) + noi thanh phong to (phai)
OFFICE = (10.787, 106.690)  # van phong JILNESTA: dat tuong trung o trung tam, khong ghi dia chi
PTS = {  # [loai, vi do, kinh do, phia uon cung]
    'tb': ['it', 10.801, 106.648, 1], 'q12': ['it', 10.853, 106.630, -1], 'q9': ['it', 10.842, 106.793, 1], 'q7': ['it', 10.731, 106.716, -1],
    'q5': ['shop', 10.755, 106.664, 1], 'gv': ['shop', 10.836, 106.667, 1], 'bt': ['shop', 10.812, 106.712, -1], 'q2': ['shop', 10.790, 106.748, 1]}
A = Frame(106.35, 107.03, 10.37, 11.17, 400)
Z = Frame(106.585, 106.825, 10.700, 10.885, 400)
out = {'city': {'W': A.W, 'H': A.H, 'hcm': A.path(hcm, .8, 2), 'nb': A.path(other, 1.6, 8),
                'office': A.pct(*OFFICE), 'box': [*A.xy(10.885, 106.585), *A.xy(10.700, 106.825)]},
       'core': {'W': Z.W, 'H': Z.H, 'hcm': Z.path(hcm, .45, 2), 'nb': Z.path(other, .6, 2), 'office': Z.pct(*OFFICE),
                'pts': {k: {'kind': v[0], 'pos': Z.pct(v[1], v[2]), 'arc': arc(Z, OFFICE, (v[1], v[2]), 9, .28, v[3])}
                        for k, v in PTS.items()}}}

# 2) Offshore: Viet Nam (trai) va Nhat Ban (phai); cung chay toi mep khung, noi sang cot "remote" o giua
HCMC, TOKYO, OSAKA, NAGOYA = (10.776, 106.701), (35.68, 139.69), (34.69, 135.50), (35.18, 136.91)
HS = [(16.83, 112.34), (16.53, 111.61), (15.78, 111.20), (16.67, 112.73), (16.45, 111.70), (17.10, 111.50), (16.98, 112.27)]
TS = [(8.646, 111.92), (11.43, 114.33), (9.88, 114.33), (10.18, 114.36), (10.37, 114.48), (8.10, 113.30), (7.89, 112.91), (8.97, 113.70), (10.92, 114.08)]
paracel = lambda ring: max(p[1] for p in ring) < 18 and min(p[0] for p in ring) > 110.5
V = Frame(102.0, 114.9, 7.6, 23.5, 400)
J = Frame(128.6, 146.0, 30.4, 45.6, 400)
EDGE_V, EDGE_J = (14.5, 114.9), (36.2, 128.6)
out['vn'] = {'W': V.W, 'H': V.H, 'vn': V.path([C['VNM']], .55, 1.2),
             'nb': V.path([C[c] for c in ('KHM', 'LAO', 'CHN', 'THA')], 1.1, 6, skip=paracel),
             'hcm': V.pct(*HCMC), 'hs': [V.xy(*p) for p in HS], 'ts': [V.xy(*p) for p in TS],
             'hsl': V.pct(17.55, 112.0), 'tsl': V.pct(12.0, 112.35),
             'arc': arc(V, HCMC, EDGE_V, 11, .22, 1)}
out['jp'] = {'W': J.W, 'H': J.H, 'jp': J.path([C['JPN']], .7, 3),
             'nb': J.path([C[c] for c in ('KOR', 'PRK', 'CHN', 'RUS')], 1.0, 6),
             'pts': {k: J.pct(*p) for k, p in (('tokyo', TOKYO), ('nagoya', NAGOYA), ('osaka', OSAKA))},
             'arcs': {k: arc(J, EDGE_J, p, 10, .18, -1) for k, p in (('osaka', OSAKA), ('nagoya', NAGOYA), ('tokyo', TOKYO))}}
json.dump(out, open(sys.argv[3], 'w'), separators=(',', ':'))
print('city', A.W, A.H, 'core', Z.W, Z.H, 'vn', V.W, V.H, 'jp', J.W, J.H, 'bytes', len(json.dumps(out)))
