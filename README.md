# GraphQL Profile

A profile page built with vanilla HTML, CSS and JavaScript that shows your school data, fetched from the platform's GraphQL API.

**Live demo:** https://giraphql.netlify.app/

## Features

- **Login** with `username:password` or `email:password` (Basic auth, returns a JWT)
- Clear error message on invalid credentials, and a **logout** button
- **Profile info:** name, login, avatar, level, audit ratio, total XP, member since
- **Two SVG graphs:**
  - XP over time (line chart, hover a point to see the project name and its XP)
  - Skills (vertical bar chart, sorted from highest to lowest)
- Handles empty accounts (no XP, no skills, no audits yet)

## How it works

1. `POST /api/auth/signin` with Basic auth returns a JWT, stored in `sessionStorage`.
2. The JWT is sent as a Bearer token to `/api/graphql-engine/v1/graphql`.
3. One query uses all three query types: normal fields (`login`, `firstName`...), nested fields (`transactions { object { name } }`), and arguments (`where: { ... }`).
4. The data is drawn with SVG elements created in JavaScript, with no chart libraries.

## Run locally

No build step. Serve the folder with any static server:

```bash
npx serve .
```

Then open the printed local URL.

## Files

```
index.html   page structure
style.css    styles
script.js    login, GraphQL queries, SVG charts
README.md    this file that your reading
img/         images
```
