# TODO

* user
    * fix verification email (aistack@towu.dev)
    * magic link login
* page
    * loading state ugly and always appearing
    * admin counter
* stacks
    - filter bar should count stacks containing at least on tool of category
    - remove create your stack CTA if already published
* stack details:
    - order of tools
    - mobile layout
    - rename edit to update
    - add update link for own stack page
* stack editing
    * guest: needs better initial name
    * cant remove photo - upload other pic also does not work
    * add go to details link
    * alias for tools and models (amp, opus, etc.)
    * inline code blocks
    * nicer lists, more space between lines
    * editor: slash commands and floating menu
        - https://tiptap.dev/docs/examples/advanced/menus
        - https://github.com/ueberdosis/tiptap/blob/main/demos/src/Examples/Menus/React/index.jsx
        - https://github.com/ueberdosis/tiptap/blob/main/demos/src/Examples/Menus/React/styles.scss
    * edit sidebar:
        - stack costs don't update for bundles
        - popular tools to add expanded by default
        - add tools to bundle (shown both in tool editing and in bundle editing)
        - expand add tools by default
        - click to edit, left side arrow to insert into editor
        - more obvious to add new tools that are missing
    * full tool blocks inline in editor (with dialog to edit) - replacing sidebar?
* CLI workflow
    * npx aistack login
    * npx aistack collect
    * npx aistack create