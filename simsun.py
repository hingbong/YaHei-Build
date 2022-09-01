import json, subprocess
dump = "SourceHanToClassic/main/otfcc/otfccdump2"
build = "SourceHanToClassic/main/otfcc/otfccbuild2"
font = json.loads(subprocess.check_output((dump, '--no-bom', 'serif/SourceHanSerif-Regular.ttf')).decode("utf-8", "ignore"))
simsun_name = json.load(open("simsun-name.json", encoding = 'utf-8'))
font["name"] = simsun_name
with open("simsun.json",'w',encoding = 'utf-8') as f:
	f.write(json.dumps(font))
subprocess.run((build, '--keep-modified-time', '--keep-average-char-width', '-O3', '-q', '-o', "simsun.ttf", "simsun.json"))

nsimsun_name = json.load(open("nsimsun-name.json", encoding = 'utf-8'))
font["name"] = nsimsun_name
with open("nsimsun.json",'w',encoding = 'utf-8') as f:
	f.write(json.dumps(font))
subprocess.run((build, '--keep-modified-time', '--keep-average-char-width', '-O3', '-q', '-o', "nsimsun.ttf", "nsimsun.json"))
