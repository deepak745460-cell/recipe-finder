/**
 * ============================================================================
 * RECIPE FINDER - SIMPLE & DIRECT SEARCH (ZERO SYNONYMS TABLE)
 * ============================================================================
 * 1. User ingredient ya recipe search kare, direct Kaggle se match ho.
 * 2. Typing ke sath search box ke neeche ingredients aur recipes suggest hon.
 * 3. Search result me sirf search se related recipes aayen (Zero irrelevant matches).
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
    // 1. DOM Elements
    const ingredientInput = document.getElementById("ingredientInput");
    const searchButton = document.getElementById("searchButton");
    const clearBtn = document.getElementById("clearBtn");
    const suggestionBox = document.getElementById("suggestionBox");
    const recipeContainer = document.getElementById("recipeContainer");
    const resultsHeader = document.getElementById("resultsHeader");
    const resultsCount = document.getElementById("resultsCount");
    const recipeModal = document.getElementById("recipeModal");
    const closeModal = document.getElementById("closeModal");
    const modalBody = document.getElementById("modalBody");

    // Kaggle Dataset (Authentic recipes)
    const allRecipes = window.KAGGLE_RECIPES || [];
    let currentResults = [];

    // Popular Ingredients for Auto-Suggest
    const POPULAR_INGREDIENTS = [
        { name: "Potato", term: "potato", icon: "🥔" },
        { name: "Aloo", term: "aloo", icon: "🥔" },
        { name: "Tomato", term: "tomato", icon: "🍅" },
        { name: "Onion", term: "onion", icon: "🧅" },
        { name: "Paneer", term: "paneer", icon: "🧀" },
        { name: "Cheese", term: "cheese", icon: "🧀" },
        { name: "Butter", term: "butter", icon: "🧈" },
        { name: "Chicken", term: "chicken", icon: "🍗" },
        { name: "Egg", term: "egg", icon: "🥚" },
        { name: "Rice", term: "rice", icon: "🍚" },
        { name: "Mushroom", term: "mushroom", icon: "🍄" },
        { name: "Green Peas", term: "peas", icon: "🟢" },
        { name: "Spinach", term: "palak", icon: "🥬" },
        { name: "Fish", term: "fish", icon: "🐟" },
        { name: "Mutton", term: "mutton", icon: "🥩" },
        { name: "Noodles", term: "noodles", icon: "🍜" },
        { name: "Pasta", term: "pasta", icon: "🍝" }
    ];

    // Helper: Punctuation hata kar clean space-separated text banana
    function cleanText(str) {
        if (!str) return "";
        return str.toLowerCase()
            .replaceAll(",", " ")
            .replaceAll(".", " ")
            .replaceAll("-", " ")
            .replaceAll("(", " ")
            .replaceAll(")", " ")
            .replaceAll("/", " ")
            .replaceAll(":", " ")
            .replaceAll(";", " ")
            .replaceAll("'", " ")
            .replaceAll('"', " ")
            .replaceAll("!", " ")
            .replaceAll("?", " ")
            .split(" ")
            .filter(Boolean)
            .join(" ");
    }

    // Helper: Exact word ya phrase check karna (Taaki 'pachai' me 'chai' ya 'steam' me 'tea' na match ho)
    function hasWordOrPhrase(fullText, target) {
        if (!fullText || !target) return false;
        const cleanFull = " " + cleanText(fullText) + " ";
        const cleanTarget = cleanText(target);
        return cleanFull.includes(" " + cleanTarget + " ");
    }

    // ========================================================================
    // 2. AUTO-SUGGEST (Typing ke sath ingredient aur recipe show karna)
    // ========================================================================
    function updateSuggestions() {
        const text = ingredientInput.value.toLowerCase().trim();
        clearBtn.style.display = text.length > 0 ? "block" : "none";

        if (text.length === 0) {
            suggestionBox.style.display = "none";
            suggestionBox.innerHTML = "";
            return;
        }

        const matches = [];

        // Step A: Matching Ingredients
        for (let i = 0; i < POPULAR_INGREDIENTS.length; i++) {
            const ing = POPULAR_INGREDIENTS[i];
            if (ing.name.toLowerCase().includes(text) || ing.term.includes(text)) {
                matches.push({ title: ing.name, term: ing.term, icon: ing.icon, type: "Ingredient" });
            }
        }

        // Step B: Matching Recipes from Kaggle Dataset (Max 4 recipes)
        let recipeMatches = 0;
        for (let i = 0; i < allRecipes.length && recipeMatches < 4; i++) {
            const r = allRecipes[i];
            if (hasWordOrPhrase(r.title, text) || r.title.toLowerCase().includes(text)) {
                matches.push({ title: r.title, term: r.title, icon: "🍲", type: "Recipe" });
                recipeMatches++;
            }
        }

        if (matches.length === 0) {
            suggestionBox.style.display = "none";
            return;
        }

        // Render suggestion box items (Max 6)
        let html = "";
        const maxShow = Math.min(matches.length, 6);
        for (let i = 0; i < maxShow; i++) {
            const m = matches[i];
            html += `
                <div class="suggestion-item" data-term="${escapeHtml(m.term)}">
                    <span class="sugg-icon">${m.icon}</span>
                    <span class="sugg-text">${escapeHtml(m.title)}</span>
                    <span class="sugg-type">${m.type}</span>
                </div>
            `;
        }

        suggestionBox.innerHTML = html;
        suggestionBox.style.display = "block";

        // Click suggestion item
        const items = suggestionBox.querySelectorAll(".suggestion-item");
        items.forEach((item) => {
            item.addEventListener("click", function () {
                ingredientInput.value = this.getAttribute("data-term");
                suggestionBox.style.display = "none";
                performSearch();
            });
        });
    }

    // ========================================================================
    // 3. STRICT SEARCH (Direct search without synonyms table)
    // ========================================================================
    function searchRecipes(queryText) {
        const q = queryText.toLowerCase().trim();
        if (!q) return [];

        const terms = q.includes(",") ? q.split(",").map((s) => s.trim()).filter(Boolean) : [q];
        const scored = [];

        allRecipes.forEach((recipe) => {
            const title = recipe.title || "";
            const kw = (recipe.keywords || []).join(" ");
            const ings = (recipe.extendedIngredients || []).map((i) => i.original || i.name || "").join(" ");

            let allTermsMatched = true;
            let score = 0;

            for (let i = 0; i < terms.length; i++) {
                const term = terms[i];
                let termFound = false;

                // Priority 1: Dish Title match (Highest relevance)
                if (hasWordOrPhrase(title, term)) {
                    termFound = true;
                    score += 100;
                }
                // Priority 2: Keywords match
                else if (hasWordOrPhrase(kw, term)) {
                    termFound = true;
                    score += 50;
                }
                // Priority 3: Ingredients match
                else if (hasWordOrPhrase(ings, term)) {
                    termFound = true;
                    score += 20;
                }

                if (!termFound) {
                    allTermsMatched = false;
                    break;
                }
            }

            if (allTermsMatched && score > 0) {
                scored.push({ recipe, score });
            }
        });

        // Sabse relevant recipes top par sort karein
        scored.sort((a, b) => b.score - a.score);
        return scored.map((s) => s.recipe);
    }

    // Search Execution
    function performSearch() {
        const query = ingredientInput.value.trim();
        suggestionBox.style.display = "none";

        if (!query) {
            recipeContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h3>Please type an ingredient or dish name!</h3>
                    <p>Try potato, aloo, paneer, chicken, samosa, or burger.</p>
                </div>
            `;
            resultsHeader.style.display = "none";
            return;
        }

        currentResults = searchRecipes(query);
        renderResults();
    }

    // ========================================================================
    // 4. DISPLAY RESULTS (Simple recipe cards)
    // ========================================================================
    function renderResults() {
        resultsHeader.style.display = "flex";
        resultsCount.textContent = `${currentResults.length} recipes found`;

        if (currentResults.length === 0) {
            recipeContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-utensils"></i></div>
                    <h3>No Recipes Found</h3>
                    <p>No matching recipe found in Kaggle dataset. Try another ingredient!</p>
                </div>
            `;
            return;
        }

        let html = "";
        for (let i = 0; i < currentResults.length; i++) {
            const r = currentResults[i];
            const isVeg = r.isVeg === true;
            const dietClass = isVeg ? "veg" : "nonveg";
            const dietText = isVeg ? "Pure Veg" : "Non-Veg";

            const ingPreview = (r.extendedIngredients || [])
                .slice(0, 4)
                .map((ing) => ing.name || ing.original || "")
                .filter(Boolean)
                .join(", ");

            html += `
                <div class="recipe-card" data-index="${i}">
                    <div class="card-image-wrapper">
                        <img class="card-image" src="${r.image}" alt="${escapeHtml(r.title)}" onerror="this.src='images/samosa.jpg'">
                        <div class="card-diet-tag ${dietClass}">
                            <span>${dietText}</span>
                        </div>
                        <div class="card-image-overlay">
                            <span class="overlay-hint"><i class="fa-solid fa-eye"></i> View Recipe</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">${escapeHtml(r.title)}</h3>
                        <div class="ingredient-tags">
                            <span class="badge used"><i class="fa-solid fa-clock"></i> ${r.readyInMinutes || 25} mins</span>
                            <span class="badge missed"><i class="fa-solid fa-users"></i> ${r.servings || 4} servings</span>
                        </div>
                        <div class="ingredients-detail">
                            <strong>Key Ingredients:</strong> ${escapeHtml(ingPreview || "Spices, oil, salt")}
                        </div>
                        <div class="card-action-link">
                            <span>View Full Recipe</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>
            `;
        }

        recipeContainer.innerHTML = html;

        // Card click par modal open karein
        const cards = recipeContainer.querySelectorAll(".recipe-card");
        cards.forEach((card) => {
            card.addEventListener("click", function () {
                const idx = parseInt(this.getAttribute("data-index"), 10);
                openModal(currentResults[idx]);
            });
        });
    }

    // ========================================================================
    // 5. RECIPE DETAIL MODAL (Recipe steps & ingredients)
    // ========================================================================
    function openModal(recipe) {
        if (!recipe) return;

        const isVeg = recipe.isVeg === true;
        const dietColor = isVeg ? "#16a34a" : "#dc2626";

        // Ingredients list
        const ings = recipe.extendedIngredients || [];
        let ingsHtml = "";
        for (let i = 0; i < ings.length; i++) {
            const ingText = ings[i].original || ings[i].name || "";
            ingsHtml += `<li><i class="fa-solid fa-circle-check" style="color: ${dietColor}"></i> ${escapeHtml(ingText)}</li>`;
        }

        // Steps list
        let stepsHtml = "";
        if (Array.isArray(recipe.instructions)) {
            for (let i = 0; i < recipe.instructions.length; i++) {
                stepsHtml += `<li>${escapeHtml(recipe.instructions[i])}</li>`;
            }
        } else if (typeof recipe.instructions === "string") {
            stepsHtml = `<li>${escapeHtml(recipe.instructions)}</li>`;
        }

        modalBody.innerHTML = `
            <img class="modal-hero-img" src="${recipe.image}" alt="${escapeHtml(recipe.title)}" onerror="this.src='images/samosa.jpg'">
            <div class="modal-details">
                <h2 class="modal-title">${escapeHtml(recipe.title)}</h2>
                <div class="modal-meta-grid">
                    <div class="meta-box"><i class="fa-solid fa-leaf" style="color: ${dietColor}"></i><span>Diet</span><strong style="color: ${dietColor}">${isVeg ? "Pure Veg" : "Non-Veg"}</strong></div>
                    <div class="meta-box"><i class="fa-solid fa-clock"></i><span>Cooking Time</span><strong>${recipe.readyInMinutes || 25} mins</strong></div>
                    <div class="meta-box"><i class="fa-solid fa-users"></i><span>Servings</span><strong>${recipe.servings || 4} people</strong></div>
                </div>
                <h3 class="modal-section-title"><i class="fa-solid fa-carrot"></i> Ingredients Required:</h3>
                <ul class="modal-ingredients-list">${ingsHtml || "<li>Ingredients details unavailable.</li>"}</ul>
                <h3 class="modal-section-title"><i class="fa-solid fa-fire-burner"></i> Cooking Steps:</h3>
                <ol class="modal-instructions-list">${stepsHtml || "<li>Follow standard recipe steps.</li>"}</ol>
            </div>
        `;

        recipeModal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    function closeModalPopup() {
        recipeModal.style.display = "none";
        document.body.style.overflow = "auto";
    }

    // ========================================================================
    // 6. EVENT LISTENERS
    // ========================================================================
    searchButton.addEventListener("click", performSearch);
    ingredientInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") performSearch();
    });

    ingredientInput.addEventListener("input", updateSuggestions);

    clearBtn.addEventListener("click", function () {
        ingredientInput.value = "";
        clearBtn.style.display = "none";
        suggestionBox.style.display = "none";
        ingredientInput.focus();
    });

    document.addEventListener("click", function (e) {
        if (!suggestionBox.contains(e.target) && e.target !== ingredientInput) {
            suggestionBox.style.display = "none";
        }
    });

    if (closeModal) closeModal.addEventListener("click", closeModalPopup);
    if (recipeModal) {
        recipeModal.addEventListener("click", function (e) {
            if (e.target === recipeModal) closeModalPopup();
        });
    }
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeModalPopup();
    });

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    }
});
