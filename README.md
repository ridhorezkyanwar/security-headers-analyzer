# Security Headers Analyzer

A Next.js web application that inspects selected HTTP security headers for a target website and presents a score, a letter grade, detailed checks, and suggested remediations.

**Demo:** [security-headers-analyzer.vercel.app](https://security-headers-analyzer.vercel.app/)

## Features

- Checks HTTPS and six response headers: Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.
- Shows an overall score and grade, plus the value, severity, and recommendation for each check.
- Identifies some common CDN or anti-bot signals that may affect which headers are visible.
- Keeps up to five recent scan results in browser local storage.
- Downloads the current result as a JSON report.

## Technology

- Next.js App Router and React
- TypeScript
- Tailwind CSS
- Zod for input validation
- Framer Motion, Heroicons, and Lucide React

## Run locally

### Requirements

Install Node.js and npm.

### Setup

```bash
git clone https://github.com/ridhorezkyanwar/security-headers-analyzer.git
cd security-headers-analyzer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
npm run lint
npm run build
```

These commands run the repository's configured lint and production-build scripts. Their presence in this README does not imply they have passed in every environment.

## How the score should be interpreted

The grade is a heuristic summary of the checks implemented in this project. Header presence alone does not establish that a website is secure, and this tool is not a substitute for a complete security review. Results can also be incomplete when a target blocks automated requests or hides response headers.

Only analyze websites you own or are authorized to assess. The application makes a server-side request to the URL entered by the user; URL-format validation alone is not proof that a destination is safe to fetch.
