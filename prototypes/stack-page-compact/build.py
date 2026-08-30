#!/usr/bin/env python3
"""Rebuild the self-contained demo: template.html + slim.json + variants.js -> index.html"""
d=open('slim.json').read().replace('</','<\\/')
v=open('variants.js').read().replace('</','<\\/')
h=open('template.html').read()
assert '__DATA__' in h
h=h.replace('__DATA__',d).replace('<script src="variants.js"></script>','<script>\n'+v+'\n</script>')
open('index.html','w').write(h)
print('built index.html',len(h))
