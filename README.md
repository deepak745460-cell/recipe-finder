# Recipe Finder

A lightweight, responsive web app to search and discover delicious Indian and Asian recipes by ingredient or dish name.

## Project Overview

This project is a static recipe search application built with HTML, CSS, and JavaScript. It lets users:

- Search recipes by ingredient (for example: potato, paneer, chicken, tomato)
- Search by dish name (for example: samosa, biryani, chai, pizza)
- Get instant suggestions while typing
- View recipe cards with image, serving info, and quick highlights
- Open a detailed modal with ingredients, cooking instructions, and source link

The app uses a curated local dataset in `kaggle_recipes.js` and includes themed recipe cards for Indian favorites such as samosa, paneer butter masala, pav bhaji, biryani, chai, and more.

## Tech Stack

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Local static dataset

## Project Structure

```text
Recipe finder/
├── index.html
├── script.js
├── kaggle_recipes.js
├── styles.css
├── images/
├── README.md
└── ...
```

## Features

- Real-time search suggestions
- Ingredient-based and recipe-based lookup
- Smart filtering using dish titles, keywords, and ingredients
- Clean card-based UI
- Detailed view modal for each recipe
- Fully client-side, no backend or database required

## How to Run

Since this is a static frontend project, you can run it simply by opening the `index.html` file in a browser.

### Option 1: Open directly

1. Open `index.html` in your browser.
2. Start typing in the search box.
3. Click a search result or suggestion to view details.

### Option 2: Use a local server (recommended)

If you want to serve it locally:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Example Searches

- `paneer`
- `potato`
- `samosa`
- `chicken`
- `chai`
- `pizza`

## Notes

- The project is designed for front-end demonstration and local experimentation.
- Recipe data is stored locally in `kaggle_recipes.js`.
- Images are stored in the `images/` folder.

## License

This project is for educational/demo purposes.

## Author

Recipe Finder project
