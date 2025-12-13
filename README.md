# Autorovers Frontend

A **specs-first vehicle catalog UI** for bikes and cars, built with React + TypeScript.
Includes a **public browsing experience** and a **protected admin panel** for managing vehicles.

This project is part of the **Autorovers** system and is designed to be clean, predictable, and portfolio-grade.

---

## Live Links

- **Public UI**: https://autorovers-frontend.vercel.app/vehicles  
- **API (Swagger)**: https://autorovers-api.onrender.com/swagger/index.html  

---

## What This App Does

### Public
- Browse bikes and cars in a unified catalog
- Search by brand / model / variant
- Filter by vehicle type (bike / car)
- Sort by price or year
- Detailed vehicle pages with structured specs
- Defensive rendering for missing / optional data
- Fully responsive layout

### Admin
- JWT-based login
- Protected admin routes
- Vehicle list with sorting
- Create / edit vehicles using a slide-over form
- Basic validation and error handling

---

## Tech Stack

- **Frontend**: React + TypeScript (Vite)
- **Routing**: React Router
- **State**: Local state + hooks
- **Styling**: Plain CSS (`public.css`, `admin.css`)
- **Auth**: JWT (token stored client-side)
- **Deployment**: Vercel

---

## Project Structure (Simplified)

```txt
src/
├── public/                # Public pages (catalog, details, login)
├── features/
│   ├── auth/              # Auth API + storage
│   └── vehicles/          # Vehicle domain (types, API, components)
├── components/layout/     # Shared layouts
├── styles/
│   ├── public.css
│   └── admin.css
```

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env.local` file (**never commit this**):

```env
VITE_API_BASE_URL=https://autorovers-api.onrender.com
```

### 3. Run locally

```bash
npm run dev
```

Open: [http://localhost:5173/vehicles](http://localhost:5173/vehicles)

---

## Deployment

Deployed using **Vercel**.

* Set `VITE_API_BASE_URL` in Vercel Environment Variables
* Build command: `npm run build`
* Output directory: `dist`

---

## Security Notes

* Admin endpoints are protected via JWT
* `.env.local` is ignored and must never be committed
* Sensitive values are configured only via environment variables

---

## Roadmap

* Bulk vehicle import for admin
* Pagination / infinite scroll on catalog
* Improved admin form validation UX
* Better image placeholders & fallbacks
* Performance optimizations

---

## License

MIT