"""Generate tests/fixtures/thermofeel-reference.json.

Fetches real Open-Meteo hourly inputs for four Texas cities, computes the
cosine of the solar zenith angle with the NOAA general solar position
equations (same as lib/heat/solar.ts), and runs ECMWF thermofeel's Liljegren
WBGT as the reference. Run with a Python env that has thermofeel and numpy.
"""
import json, math, urllib.request
from datetime import datetime, timezone
import numpy as np
import thermofeel as tf

CITIES = {"austin": (30.2672, -97.7431), "houston": (29.7604, -95.3698), "lubbock": (33.5779, -101.8552), "el_paso": (31.7619, -106.4850)}
HOURLY = "temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,shortwave_radiation_instant,direct_radiation_instant"

def cos_zenith(t: datetime, lat: float, lon: float) -> float:
    year = t.year
    doy = t.timetuple().tm_yday
    hour = t.hour + t.minute / 60 + t.second / 3600
    days = 366 if (year % 4 == 0 and year % 100 != 0) or year % 400 == 0 else 365
    g = 2 * math.pi / days * (doy - 1 + (hour - 12) / 24)
    eqt = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g) - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    decl = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g)
            + 0.000907 * math.sin(2 * g) - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    ha = math.radians((hour * 60 + eqt + 4 * lon) / 4 - 180)
    la = math.radians(lat)
    return max(-1.0, min(1.0, math.sin(la) * math.sin(decl) + math.cos(la) * math.cos(decl) * math.cos(ha)))

cases = []
for name, (lat, lon) in CITIES.items():
    url = (f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly={HOURLY}"
           "&wind_speed_unit=ms&timezone=UTC&forecast_days=3")
    d = json.load(urllib.request.urlopen(url, timeout=30))["hourly"]
    for i, ts in enumerate(d["time"]):
        t = datetime.fromisoformat(ts).replace(tzinfo=timezone.utc)
        sw = d["shortwave_radiation_instant"][i]; dr = d["direct_radiation_instant"][i]
        if sw is None or d["temperature_2m"][i] is None:
            continue
        fdir = (dr / sw) if sw > 0 else 0.0
        cz = cos_zenith(t, lat, lon)
        w = tf.calculate_wbgt_liljegren(np.array([d["temperature_2m"][i] + 273.15]), np.array([d["relative_humidity_2m"][i]]),
                                        np.array([d["surface_pressure"][i]]), np.array([d["wind_speed_10m"][i]]),
                                        np.array([sw]), np.array([fdir]), np.array([cz]))[0]
        if not np.isfinite(w):
            continue
        cases.append({"city": name, "lat": lat, "lon": lon, "time": t.isoformat().replace("+00:00", "Z"),
                      "tempC": d["temperature_2m"][i], "rhPct": d["relative_humidity_2m"][i], "pressureHpa": d["surface_pressure"][i],
                      "wind10mMs": d["wind_speed_10m"][i], "shortwaveWm2": sw, "fdir": fdir, "cosZenith": cz,
                      "expectedWbgtC": float(w) - 273.15})

print(len(cases), "cases")
with open("tests/fixtures/thermofeel-reference.json", "w") as f:
    json.dump({"source": "thermofeel " + tf.__version__ if hasattr(tf, "__version__") else "thermofeel",
               "generated": datetime.now(timezone.utc).isoformat(), "cases": cases}, f, indent=1)
