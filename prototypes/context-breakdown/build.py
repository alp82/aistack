#!/usr/bin/env python3
"""Rebuild the self-contained demo -> index.html

Reuses the accepted page from ../stack-page-compact (template, data and every
variant) and adds the context-breakdown variants from variants9.js on top.
ctx.json is the real per-call reading scanned from this machine's own logs.
"""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
base = os.path.join(here, '..', 'stack-page-compact')
rd = lambda p: open(p).read()
esc = lambda s: s.replace('</', '<\\/')

data = json.loads(rd(os.path.join(base, 'slim.json')))
data['ctx'] = json.loads(rd(os.path.join(here, 'ctx.json')))
h = rd(os.path.join(base, 'template.html'))
assert '__DATA__' in h
h = h.replace('__DATA__', esc(json.dumps(data)))
for f in ('variants.js', 'variants2.js', 'variants3.js', 'variants4.js', 'variants5.js',
          'variants6.js', 'variants7.js', 'variants8.js'):
    h = h.replace(f'<script src="{f}"></script>', '<script>\n' + esc(rd(os.path.join(base, f))) + '\n</script>')
# my variants need VARIANTS/RENDER, which the switcher script declares first, and
# must register before it runs measureAll(): splice them in after the declarations.
mine = esc(rd(os.path.join(here, 'variants9.js')))
split = 'const page=document.getElementById("page");'
assert split in h
h = h.replace(split, mine + '\n' + split)
h = h.replace('return RENDER[v]?v:"v43";', 'return RENDER[v]?v:"c1";')
# no variant bar and no toggles: the page as committed plus the Context row
h = h.replace('</style>\n</head>', '#switcher{display:none}\n</style>\n</head>', 1)
h = h.replace('<title>#356 · production integration over the accepted compact page</title>',
              '<title>context breakdown · three variants over the accepted page</title>')
h = h.replace('<b>alp82/aistack#356</b> · production integration over the accepted v38/v37 page',
              '<b>context breakdown</b> · a Context row at the head of the Stats accordion, over the page as committed')
h = h.replace('real prod data, 2026-08-30', 'prod data 2026-08-30 · context reading from this machine, 30 days to 2026-09-07')
open(os.path.join(here, 'index.html'), 'w').write(h)
print('built index.html', len(h))
