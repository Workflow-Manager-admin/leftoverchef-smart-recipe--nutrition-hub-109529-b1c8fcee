import React, { useState, useEffect } from "react";
import "./App.css";
import "./RecipeStyles.css";
import logo from "./logo.svg";

// --- Color constants from requirements
const COLORS = {
  primary: "#34a853",
  secondary: "#fbbc05",
  accent: "#ea4335",
};

// --- Smart Tag definitions
const TAGS = [
  { label: "Healthy", color: COLORS.primary },
  { label: "Junk", color: COLORS.accent },
  { label: "Low-Carb", color: "#33c3f0" },
  { label: "High Protein", color: "#4056a1" },
  { label: "Vegan", color: "#b6e2d3" },
  { label: "Avoid for Diabetics", color: "#bb2124" }
];

// Utility for nutrition bar color based on nutrient type
const getBarColor = (nutrient) => {
  switch (nutrient) {
    case "calories":
      return COLORS.accent;
    case "carbs":
      return COLORS.secondary;
    case "fats":
      return "#91672c";
    case "protein":
      return COLORS.primary;
    default:
      return "#bbbbbb";
  }
};

// Dummy images fallback for recipes
const DUMMY_IMG = "https://source.unsplash.com/300x200/?recipe,food,healthy";

// PUBLIC_INTERFACE
function App() {
  const [theme] = useState("light"); // Future: support theme switch if needed
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientList, setIngredientList] = useState([]); // [{name, quantity, selected}]
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  // PUBLIC_INTERFACE
  // Handles addition of ingredients from input
  const handleAddIngredient = () => {
    const value = ingredientInput.trim();
    if (!value) return;
    setIngredientList([
      ...ingredientList,
      { name: value, quantity: 1, selected: true },
    ]);
    setIngredientInput("");
  };

  // PUBLIC_INTERFACE
  // Toggle ingredient selection (for inclusion in search)
  const handleIngredientToggle = (idx) => {
    setIngredientList((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // PUBLIC_INTERFACE
  // Update quantity
  const handleQuantityChange = (idx, change) => {
    setIngredientList((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  // PUBLIC_INTERFACE
  // Remove an ingredient
  const removeIngredient = (idx) => {
    setIngredientList((prev) => prev.filter((_, i) => i !== idx));
  };

  // PUBLIC_INTERFACE
  // Handles API call to get live recipe suggestions from Spoonacular API (REFINED: fetch full details for each result to guarantee nutrition + steps)
  const handleFindRecipes = async () => {
    setLoading(true);
    setRecipes([]); // Clear old
    setSelectedRecipe(null);

    // Prepare ingredient list for query
    const includedIngredients = ingredientList
      .filter((item) => item.selected)
      .map((item) => item.name)
      .join(",");

    // --- LOGGING/DEBUG --- Inspect outgoing ingredient list
    console.log("[RecipeSearch] Included ingredients for search:", includedIngredients, ingredientList);

    if (!includedIngredients) {
      setLoading(false);
      alert("Please select at least one ingredient before searching for recipes.");
      return;
    }

    // Use provided API key directly for now (NOTE: not safe for prod!)
    const apiKey = "dc49e1088db742eea575fd4596dee395";

    try {
      // 1. Search recipes by ingredient (only fetch light info & IDs first)
      const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?includeIngredients=${encodeURIComponent(
        includedIngredients
      )}&number=6&instructionsRequired=true&apiKey=${apiKey}`;
      console.log("[RecipeSearch] Outbound: complexSearch URL", searchUrl);

      const searchResp = await fetch(searchUrl);

      // Log status and headers
      console.log("[RecipeSearch] complexSearch response status:", searchResp.status, "ok:", searchResp.ok);

      if (!searchResp.ok) {
        // Try to read body for error details
        let errTxt = "";
        try { errTxt = await searchResp.text(); } catch {}
        console.error("[RecipeSearch] API connection failed: ", searchResp.status, errTxt);
        throw new Error("API connection failed: " + searchResp.status + " " + errTxt);
      }
      const searchData = await searchResp.json();
      console.log("[RecipeSearch] complexSearch response data:", searchData);

      if (!searchData.results || searchData.results.length === 0) {
        setRecipes([]);
        setLoading(false);
        alert(
          includedIngredients
            ? "No recipes found for the selected ingredients. Try different ones or check for typos."
            : "Please add and select at least one ingredient."
        );
        return;
      }

      // 2. For each recipe, fetch /recipes/{id}/information to guarantee detailed steps & nutrition
      const recipesData = await Promise.all(
        searchData.results.map(async (basicRecipe) => {
          try {
            const infoUrl = `https://api.spoonacular.com/recipes/${basicRecipe.id}/information?includeNutrition=true&apiKey=${apiKey}`;
            console.log("[RecipeSearch] Outbound: recipe/information URL", infoUrl);

            const infoResp = await fetch(infoUrl);
            console.log(
              `[RecipeSearch] /information resp for recipe ${basicRecipe.id} status:`,
              infoResp.status, "ok:", infoResp.ok
            );

            if (!infoResp.ok) {
              let infoErr = "";
              try { infoErr = await infoResp.text(); } catch {}
              console.error("[RecipeSearch] Info load failed", infoResp.status, infoErr);
              throw new Error("Missing info for recipe " + basicRecipe.id + ": " + infoResp.status + " " + infoErr);
            }

            const info = await infoResp.json();
            console.log(`[RecipeSearch] Recipe info (${basicRecipe.id}):`, info);

            // --- Extract stepwise instructions ---
            let steps = [];
            if (info.analyzedInstructions && info.analyzedInstructions.length > 0) {
              steps = info.analyzedInstructions[0].steps.map((s) => s.step).filter(Boolean);
            } else if (typeof info.instructions === "string" && info.instructions.trim()) {
              // Fallback: split on dot if no structured steps
              steps = info.instructions.split(/(?<=\.)\s+/).filter((s) => s.trim().length > 0);
            }
            if (steps.length === 0) steps = ["Stepwise instructions not available for this recipe."];

            // --- Extract nutrition ---
            // Find values (kcal, grams) and label accordingly
            let nutrition = { calories: null, carbs: null, fats: null, protein: null };
            if (info.nutrition && Array.isArray(info.nutrition.nutrients)) {
              for (const n of info.nutrition.nutrients) {
                const lname = n.name.toLowerCase();
                if (lname === "calories") nutrition.calories = Math.round(n.amount); // kcal
                else if (lname === "carbohydrates") nutrition.carbs = Math.round(n.amount); // g
                else if (lname === "fat" || lname === "fats") nutrition.fats = Math.round(n.amount);
                else if (lname === "protein") nutrition.protein = Math.round(n.amount);
              }
            }
            // Fallback: top-level fields or N/A if still null
            if (nutrition.calories == null && info.calories) nutrition.calories = Math.round(info.calories);
            ["carbs", "fats", "protein"].forEach((k) => {
              if (nutrition[k] == null) nutrition[k] = 0;
            });
            if (nutrition.calories == null) nutrition.calories = 0;

            // --- Smart tags ---
            const lowerTitle = (info.title || "").toLowerCase();
            const tags = [];
            if (info.vegetarian || info.vegan) tags.push("Vegan");
            if (nutrition.carbs < 25) tags.push("Low-Carb");
            if (nutrition.protein > 15) tags.push("High Protein");
            if (nutrition.calories < 350) tags.push("Healthy");
            if (/nachos|fries|burger|chip|fried|junk/.test(lowerTitle)) tags.push("Junk");
            if (
              /sugar|syrup|honey|sweet|dessert|pie|cake/.test(lowerTitle) ||
              nutrition.carbs > 35
            ) {
              tags.push("Avoid for Diabetics");
            }

            // --- Ingredients list ---
            let ingredientsList;
            if (Array.isArray(info.extendedIngredients) && info.extendedIngredients.length > 0) {
              ingredientsList = info.extendedIngredients.map(
                (i) =>
                  `${i.original || i.name}${i.amount ? ` (${Number(i.amount).toFixed(1)}${i.unit ? " " + i.unit : ""})` : ""}`
              );
            } else if (Array.isArray(info.ingredients) && info.ingredients.length > 0) {
              ingredientsList = info.ingredients.map((i) => i.original || i.name || i);
            } else {
              ingredientsList = info.summary ? [info.summary] : ["Ingredients not available."];
            }

            return {
              id: info.id,
              name: info.title || basicRecipe.title || "Unnamed",
              image: info.image || basicRecipe.image,
              prep_time: info.readyInMinutes || info.preparationMinutes || "--",
              ingredients: ingredientsList,
              steps,
              nutrition,
              tags,
            };
          } catch (innerErr) {
            // Gracefully show fallback for this recipe if fetch failed
            console.error("[RecipeSearch] Error loading recipe details for id", basicRecipe.id, innerErr);
            return {
              id: basicRecipe.id,
              name: basicRecipe.title || "Recipe unavailable",
              image: basicRecipe.image,
              prep_time: "--",
              ingredients: ["Ingredients not available."],
              steps: ["Instructions not available."],
              nutrition: { calories: 0, carbs: 0, fats: 0, protein: 0 },
              tags: [],
              error: "Details could not be loaded. " + (innerErr && innerErr.message ? innerErr.message : "")
            };
          }
        })
      );
      console.log("[RecipeSearch] Final recipesData:", recipesData);
      setRecipes(recipesData);
    } catch (e) {
      setRecipes([]);
      // eslint-disable-next-line
      console.error("[RecipeSearch] ERROR in handleFindRecipes:", e);
      // Instead of just alert, also show on page for debugging (user and dev)
      setRecipes([{
        id: "fail",
        name: "Recipe Fetch failed!",
        image: DUMMY_IMG,
        ingredients: [],
        steps: [],
        nutrition: { calories: 0, carbs: 0, fats: 0, protein: 0 },
        tags: [],
        error: "Failed to fetch recipes. " + (e?.message || "Unknown error. The Spoonacular API may have reached its quota or key is invalid. Please check developer console for full details.")
      }]);
      // Also alert user plainly for UI experience
      alert("Failed to fetch recipes. " + (e?.message ? e.message : "The Spoonacular API may have reached its quota or key is invalid."));
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  // Toggle favorite
  const handleFavorite = (recipe) => {
    setFavorites((prev) => {
      const exist = prev.find((r) => r.id === recipe.id);
      return exist
        ? prev.filter((r) => r.id !== recipe.id)
        : [...prev, recipe];
    });
  };

  // PUBLIC_INTERFACE
  // Check for favorite
  const isFavorite = (id) => favorites.some((r) => r.id === id);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const favs = localStorage.getItem("favorites");
    if (favs) {
      setFavorites(JSON.parse(favs));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  return (
    <div className="main-app">
      {/* HEADER */}
      <header className="header">
        <img src={logo} alt="LeftoverChef logo" className="header-logo" />
        <nav className="nav">
          <span className="nav-title">LeftoverChef – Smart Recipe & Nutrition Hub</span>
        </nav>
      </header>

      {/* LAYOUT */}
      <div className="layout-wrapper">
        {/* Sidebar - Favorites */}
        <aside className="sidebar">
          <h3>Favorites</h3>
          <FavoritesList
            favorites={favorites}
            onSelect={setSelectedRecipe}
            onRemove={(id) =>
              setFavorites((prev) => prev.filter((r) => r.id !== id))
            }
          />
        </aside>

        {/* Main Content Area */}
        <main className="content">
          <section>
            <h2>Enter Your Ingredients</h2>
            <div className="ingredient-input-bar">
              <input
                aria-label="Ingredient name"
                value={ingredientInput}
                placeholder="e.g. tomato"
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddIngredient();
                }}
              />
              <button className="primary-btn" onClick={handleAddIngredient}>
                Add
              </button>
            </div>
            <IngredientList
              ingredients={ingredientList}
              onToggle={handleIngredientToggle}
              onQuantityChanged={handleQuantityChange}
              onRemove={removeIngredient}
            />
          </section>

          <section className="find-recipes-section">
            <button
              className="accent-btn"
              onClick={handleFindRecipes}
              disabled={loading || ingredientList.length === 0}
              style={{ minWidth: "180px" }}
            >
              {loading ? "Finding Recipes..." : "Find Recipes"}
            </button>
          </section>

          <section>
            <h2>Recipe Suggestions</h2>
            {loading && <div className="loading">Loading...</div>}
            {!loading && recipes.length === 0 && (
              <div className="muted">No recipes to show. Try adding ingredients.</div>
            )}
            <RecipeList
              recipes={recipes}
              favorites={favorites}
              onOpen={(r) => setSelectedRecipe(r)}
              onFav={handleFavorite}
              isFav={isFavorite}
            />
          </section>
        </main>

        {/* Recipe Details Modal/Panel */}
        <RecipeDetailsModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onFav={handleFavorite}
          isFav={isFavorite}
        />
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span>
          Smart Cooking Assistant &copy; {new Date().getFullYear()} |{" "}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            About & Info
          </a>
        </span>
      </footer>
    </div>
  );
}

// --- COMPONENTS ---

// IngredientList: Inputted ingredients with checkbox & quantity
function IngredientList({ ingredients, onToggle, onQuantityChanged, onRemove }) {
  if (!ingredients.length) return null;
  return (
    <ul className="ingredient-list">
      {ingredients.map((ing, idx) => (
        <li key={idx} className="ingredient-item">
          <input
            type="checkbox"
            checked={!!ing.selected}
            onChange={() => onToggle(idx)}
            aria-label={`Use ${ing.name}`}
          />
          <span className="ingredient-name">{ing.name}</span>
          <div className="quantity-controls">
            <button
              onClick={() => onQuantityChanged(idx, -1)}
              className="qty-btn"
              aria-label="Decrease quantity"
            >-</button>
            <span className="ingredient-qty">{ing.quantity}</span>
            <button
              onClick={() => onQuantityChanged(idx, 1)}
              className="qty-btn"
              aria-label="Increase quantity"
            >+</button>
          </div>
          <button
            className="remove-btn"
            aria-label="Remove ingredient"
            onClick={() => onRemove(idx)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}

// RecipeList: Display recipe cards
function RecipeList({ recipes, onOpen, onFav, favorites, isFav }) {
  if (!recipes.length) return null;
  return (
    <div className="recipe-list">
      {recipes.map((r) => (
        <div className="recipe-card" key={r.id}>
          <img
            src={r.image || DUMMY_IMG}
            className="recipe-thumb"
            alt={r.name}
            onClick={() => onOpen(r)}
          />
          <div className="recipe-summary">
            <div className="recipe-card-title" onClick={() => onOpen(r)}>
              {r.name}
            </div>
            <SmartTags tags={r.tags} />

            <div className="recipe-small-text">
              <span>Prep time: {r.prep_time} min</span>
            </div>
            <NutritionBars nutrition={r.nutrition} />
            <button
              className={isFav(r.id) ? "fav-btn selected" : "fav-btn"}
              aria-label={isFav(r.id) ? "Unfavorite" : "Favorite"}
              onClick={() => onFav(r)}
              title={isFav(r.id) ? "Remove from favorites" : "Add to favorites"}
            >
              {isFav(r.id) ? "★" : "☆"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/*
  RecipeDetailsModal: Shows selected recipe in detail.
  - Stepwise instructions (gracefully show message if missing)
  - Nutrition values always labeled (g/kcal)
  - Handles missing data gracefully
*/
function RecipeDetailsModal({ recipe, onClose, onFav, isFav }) {
  if (!recipe) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        tabIndex={0}
      >
        <button className="close-modal-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
        <img
          src={recipe.image || DUMMY_IMG}
          alt={recipe.name}
          className="modal-img"
        />
        <h2>{recipe.name}</h2>
        {recipe.error ? (
          <div style={{ color: "#bb2124", fontWeight: 700, margin: "1em 0" }}>
            {recipe.error}
          </div>
        ) : null}
        <SmartTags tags={recipe.tags} />
        <div className="modal-subtext">
          <span>Prep time: {recipe.prep_time} min</span>
        </div>
        <h4>Ingredients:</h4>
        <ul className="modal-ingredients-list">
          {(Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) ?
            recipe.ingredients.map((ing, idx) => (<li key={idx}>{ing}</li>)) :
            <li className="muted">No ingredients available.</li>
          }
        </ul>
        <h4>Instructions:</h4>
        {(!Array.isArray(recipe.steps) || recipe.steps.length === 0 || (recipe.steps.length === 1 && !recipe.steps[0].trim())) ? (
          <div className="muted" style={{ margin: "0.8em 0 1.1em" }}>
            No instructions available for this recipe.
          </div>
        ) : (
          <ol className="modal-steps">
            {recipe.steps.map((step, idx) =>
              <li key={idx}>{step}</li>
            )}
          </ol>
        )}
        <h4>Nutritional Breakdown</h4>
        <NutritionBars nutrition={recipe.nutrition} showLabels />
        <button
          className={isFav(recipe.id) ? "fav-btn selected" : "fav-btn"}
          onClick={() => onFav(recipe)}
          style={{ fontSize: "2em" }}
        >
          {isFav(recipe.id) ? "★ Remove from favorites" : "☆ Add to favorites"}
        </button>
      </div>
    </div>
  );
}

// FavoritesList Sidebar
function FavoritesList({ favorites, onSelect, onRemove }) {
  if (!favorites.length)
    return <div className="muted" style={{ fontSize: "0.95em" }}>No favorites saved.</div>;
  return (
    <ul className="favorites-list">
      {favorites.map((f) => (
        <li key={f.id} onClick={() => onSelect(f)}>
          <img
            src={f.image || DUMMY_IMG}
            className="fav-thumb"
            alt={f.name}
            loading="lazy"
          />
          <span>{f.name}</span>
          <button
            className="remove-fav-btn"
            aria-label="Remove from favorites"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(f.id);
            }}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}

// SmartTags: display tags with color
function SmartTags({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="smart-tags">
      {tags.map((tag) => {
        const tagDef = TAGS.find((t) => t.label === tag) || {
          label: tag,
          color: "#888888",
        };
        return (
          <span
            key={tag}
            className="smart-tag"
            style={{ backgroundColor: tagDef.color }}
          >
            {tagDef.label}
          </span>
        );
      })}
    </div>
  );
}

/*
  NutritionBars: Enhanced color-coded nutrition bars with clear, explicit labels and values.
  - Each bar row contains the label (e.g., "Protein (g)", "Carbs (g)", etc.) next to the colored bar,
    AND the value is displayed in bold beside the bar for clarity.
  - Calories are shown in kcal, others in grams.
  - For prominent display: values use bold styling; bars have larger contrast text.
  - Responsive and WCAG-friendly for color/labelling.
  Always shown on recipes; showLabels prop can force left labels in modals.
*/
function NutritionBars({ nutrition, showLabels }) {
  // nutrition: {calories, carbs, fats, protein}
  if (!nutrition) return null;
  // Prepare all macro stats; keep max values reasonable to cap bars for common recipes
  const stats = [
    {
      key: "calories",
      label: "Calories",
      max: 700,
      getDisplay: v => `${v} kcal`,
      help: "Total calories (kcalories)"
    },
    {
      key: "carbs",
      label: "Carbs",
      max: 60,
      getDisplay: v => `${v} g`,
      help: "Carbohydrates (grams)"
    },
    {
      key: "fats",
      label: "Fats",
      max: 40,
      getDisplay: v => `${v} g`,
      help: "Fats (grams)"
    },
    {
      key: "protein",
      label: "Protein",
      max: 40,
      getDisplay: v => `${v} g`,
      help: "Protein (grams)"
    },
  ];
  return (
    <div className="nutrition-bars enhanced-nutrition">
      {stats.map((stat) => {
        const value = nutrition[stat.key] !== undefined ? nutrition[stat.key] : 0;
        const pct = Math.min(100, Math.round((value / stat.max) * 100));
        // Left label for clarity - always show label, and display legend for color association
        return (
          <div className="nutrition-bar-row enhanced-row" key={stat.key}>
            <span
              className="nutrition-bar-label enhanced-label"
              title={stat.help}
              style={{
                minWidth: 90,
                fontWeight: 700,
                color: getBarColor(stat.key),
                letterSpacing: stat.key === "calories" ? "0.5px" : "0"
              }}
            >
              {stat.label}
            </span>
            <div className="nutrition-bar-tray enhanced-tray">
              <div
                className="nutrition-bar enhanced-bar"
                style={{
                  width: `${pct}%`,
                  backgroundColor: getBarColor(stat.key),
                  color: stat.key === "calories" ? "#fff8" : "#fff",
                  border: "1.5px solid #fff3",
                  position: "relative"
                }}
                aria-label={`${stat.label}: ${value}${stat.key === "calories" ? " kcal" : " g"}`}
              >
                {/* Value inside bar only for high %; else show outside */}
                {(pct > 35) ? (
                  <span className="nutrition-bar-text enhanced-text">
                    {stat.getDisplay(value)}
                  </span>
                ) : null}
              </div>
              {/* Value always at right, not in bar if bar is short */}
              <span
                className="nutrition-value-outside"
                style={{
                  marginLeft: "0.55em",
                  fontWeight: 700,
                  color: "#23272a",
                  minWidth: 45,
                  textAlign: "right"
                }}
              >
                {(pct <= 35) ? stat.getDisplay(value) : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default App;
