# High Level Goals

Next milestone: Transform the waitlist into an MVP

## MVP Features
* Users can share their stacks
* Users can enter new tools
* Change Waitlist to Newsletter subscription
* Update Landing Page to show most recent and popular stacks

# Tasks
* Tasks are prioritized from top (first) to bottom (last)
* Whenever you start with a task, ask the user questions to clarify unknowns
* Whenever you face challenges during development, also ask the user questions
* Update task descriptions when gaining new info or completing them
* Use the question ask tool to verify with me if the task is complete or needs more work
* You can only declare a task as complete if you got my approval

## ~~Stack Details Page~~ ✅
* ~~List of stacks is shown on front page - linking to their details page~~
* ~~Stack Details show same info from card, with the full list of tools~~
* Done: Carousel + grid on landing page, details page at `/stacks/{slug}` with creator name as title, dot-separated social/project links, Solo/Team below price, oneLiner, optional description, metadata bar (stackUrl, prompts, rules, skills, mcps, resources), tool cards in responsive grid. Schema: `summary`→`oneLiner`, removed `title`, added `description`, `stackUrl`, `prompts`, `rules`, `skills`, `mcps`, `resources`.

## Adding/Editing Stacks
* Users can add new stacks
* They see the details page immediately with skeleton bars (no pulse animation) and/or blurred sections
* Step by step, they have inline forms to fill out and the edit page is building itself until it's ready
* Needs a publish button once main required data is entered (name, tools, summary)
* Stacks can be edited after publishing

## Adding Tools
* Missing Tools can be added during stack creation/editing
* Adding tools are done in an extra form in a modal