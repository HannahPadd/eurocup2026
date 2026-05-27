from glob import glob
from tqdm import tqdm
import json
import simfile

data = {}

packs = [f for f in glob("F:/Songs/*") if "EUROCUP " in f]
for p in tqdm(packs):

    songs = glob(p + "/*/*.sm") + glob(p + "/*/*.ssc")
    # print(songs)
    for s in tqdm(songs):
        file = simfile.open(s)
        group = p.split("\\")[1]
        chart = file.charts[0]

        data[file.title] = {
            'title': file.title,
            'difficulty': chart["METER"],
            'group': group
        }

with open('data.json', 'w') as f:
    json.dump(list(data.values()), f, indent=4)