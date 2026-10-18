import re, os
HERE=os.path.dirname(os.path.abspath(__file__))
PUB=os.path.normpath(os.path.join(HERE,"..","..","..","packages","website","public","workshops"))
esg=open(os.path.join(PUB,"esg-berichte-mit-ki","slides.html")).read().split("\n")
sprite="\n".join(esg[2067:2087])
head='''<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Audit Preparation with AI: Organize Evidence and Find Gaps · loehrning.ai</title>
<meta name="description" content="Workshop 05, held in North Macedonia: one invented software company, three audit requests, one set of evidence, answered live in Claude." />
<link rel="icon" href="./assets/favicon.svg" />
<link rel="stylesheet" href="./lib/tokens.css" />
<link rel="stylesheet" href="./lib/deck.css" />
<link rel="stylesheet" href="./lib/audit.css" />
'''
cover_extra='<style data-slide="01b">\n[data-n="01"] .cv-title { font-size: 120px; margin: 52px 0 40px; }\n</style>\n'
css="".join(open(os.path.join(HERE,f)).read()+"\n" for f in ["css01.txt","css03.txt"])+cover_extra
css+=open(os.path.join(HERE,"css02.txt")).read()+open(os.path.join(HERE,"css-new-a.txt")).read()+open(os.path.join(HERE,"css-setup.txt")).read()+"\n"+open(os.path.join(HERE,"css09.txt")).read()+open(os.path.join(HERE,"css-hands.txt")).read()+open(os.path.join(HERE,"css16.txt")).read()+open(os.path.join(HERE,"css18.txt")).read()+"\n"+open(os.path.join(HERE,"css-close.txt")).read()
notes=open(os.path.join(HERE,"notes.json")).read()
body='''<script src="./lib/deck-stage.js"></script>
</head>
<body>
'''+sprite+'''

<!-- speaker notes, one per slide in deck order (deck-stage.js reads them when <deck-stage> connects, so they stay above it).
     The deck has no presenter view: a notes renderer gets {slideIndexChanged: N} by postMessage. -->
<script type="application/json" id="speaker-notes">
'''+notes+'''
</script>

'''
html=head+css+body+open(os.path.join(HERE,"m01-08.html")).read()+open(os.path.join(HERE,"m09-12.html")).read()+open(os.path.join(HERE,"m13-19.html")).read()+"\n"+open(os.path.join(HERE,"scripts.html")).read()
open(os.path.join(PUB,"audit-vorbereitung-mit-ki","slides.html"),"w").write(html)
print(len(html.split("\n")),"lines",len(re.findall(r"<section\b",html)),"sections")
