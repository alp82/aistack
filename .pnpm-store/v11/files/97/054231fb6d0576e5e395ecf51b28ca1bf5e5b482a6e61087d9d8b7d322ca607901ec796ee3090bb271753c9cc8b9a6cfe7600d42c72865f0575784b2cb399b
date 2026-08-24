# @tanstack/devtools

This package is still under active development and might have breaking changes in the future. Please use it with caution.

## General Usage

```tsx
import { TanStackDevtoolsCore } from '@tanstack/devtools'

const devtools = new TanStackDevtoolsCore({
  options: {
    // your options here
  },
  plugins: [
    // your plugins here
  ],
})

devtools.mount(document.getElementById('your-devtools-container')!)
```

## Creating plugins

In order to create a plugin for TanStack Devtools, you can use the `plugins` arg of the `TanStackDevtoolsCore` class. Here's an example of how to create a simple plugin:

```ts
import { TanStackDevtoolsCore } from '@tanstack/devtools'

const devtools = new TanStackDevtoolsCore({
  config: {
    // your config here
  },
  plugins: [
    {
      id: 'my-plugin',
      name: 'My Plugin',
      render: (el) => (el.innerHTML = '<div>My Plugin Content</div>'),
    },
  ],
})
```
