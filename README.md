# Security Headers Analyzer

> Inspect a site's HTTPS setup and selected HTTP response security headers.

<p>
  <a href="https://security-headers-analyzer.vercel.app/"><img src="https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22.12-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 22.12 or newer" />
</p>

A Next.js web app that checks a target website's HTTPS configuration and selected response headers, then presents a heuristic score, a letter grade, individual checks, and suggested remediations.

## What it checks

- HTTPS availability
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

It also identifies some common CDN or anti-bot signals that can affect which headers are visible. Recent scan results can be stored in browser local storage, and the current result can be downloaded as JSON.

## Stack

- Next.js App Router and React 19
- TypeScript
- Tailwind CSS 4
- Zod input validation
- Guarded server-side URL fetching
- Framer Motion, Heroicons, and Lucide React

## Run locally

### Requirements

Node.js 22.12 or newer and npm.

### Install

```bash
git clone https://github.com/ridhorezkyanwar/security-headers-analyzer.git
cd security-headers-analyzer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification commands

```bash
npm test
npm run lint
npm run build
```

- `npm test` runs the repository's Node.js test files.
- `npm run lint` runs ESLint.
- `npm run build` creates the production build.

These commands describe the available scripts; run them locally or in CI to confirm their current result.

## How to interpret results

The grade is a heuristic summary of the checks implemented in this project. A missing header does not automatically mean a site is exploitable, and present headers do not prove a website is secure. This tool does not replace a full application-security review or penetration test.

Results may be incomplete when a site varies headers by path, region, user agent, reverse proxy, or anti-bot policy. Only scan sites you own or are authorized to assess. Although the app validates and guards URL fetching, it should not be treated as a general-purpose unrestricted URL-fetching service.
