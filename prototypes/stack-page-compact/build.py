#!/usr/bin/env python3
"""Rebuild the self-contained demo -> index.html"""
d=open('slim.json').read().replace('</','<\\/')
h=open('template.html').read()
assert '__DATA__' in h
h=h.replace('__DATA__',d)
for f in ('variants.js','variants2.js','variants3.js','variants4.js','variants5.js','variants6.js','variants7.js','variants8.js'):
    v=open(f).read().replace('</','<\\/')
    h=h.replace(f'<script src="{f}"></script>','<script>\n'+v+'\n</script>')
open('index.html','w').write(h)
print('built index.html',len(h))
