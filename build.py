#!/usr/bin/env python3
"""Assemble src/ into single-file builds.
dist/LogicLab.html   – browser version (Google Fonts link)
dist/offline.html    – font embedded, used by the desktop/Steam and Android builds
dist/artifact.html   – page fragment for the claude.ai artifact"""
import os,re,base64,subprocess
R=os.path.dirname(os.path.abspath(__file__));S=os.path.join(R,'src');D=os.path.join(R,'dist')
os.makedirs(D,exist_ok=True)
rd=lambda f:open(os.path.join(S,f),encoding='utf-8').read()
js='\n'.join(rd(f) for f in ['core.js','levels.js','content.js','editor.js','bit.js','econ.js','lib.js','menubit.js','meta.js'])
css=rd('style.css');body=rd('body.html')
ICON='<link rel="icon" type="image/png" href="data:image/png;base64,'+base64.b64encode(open(os.path.join(R,'art','icon-64.png'),'rb').read()).decode()+'">'
LINK='<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=STIX+Two+Text:ital,wght@0,400;1,400&display=swap" rel="stylesheet">'
head='<title>Logic Lab</title>\n'+ICON+'\n'+LINK+'\n<style>'+css+'</style>\n'
page=lambda h:'<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">\n'+h+'</head>\n<body>\n'+body+'\n<script>\n'+js+'\n</script>\n</body>\n</html>\n'
open(os.path.join(D,'LogicLab.html'),'w',encoding='utf-8').write(page(head))
open(os.path.join(D,'artifact.html'),'w',encoding='utf-8').write(head+body+'\n<script>\n'+js+'\n</script>\n')
fontcss=os.path.join(S,'font-embed.css')
if os.path.exists(fontcss):
    open(os.path.join(D,'offline.html'),'w',encoding='utf-8').write(page(head.replace(LINK,'<style>'+open(fontcss).read()+open(os.path.join(S,'font-math.css')).read()+'</style>')))
print('built',len(js)//1024,'KB js')
