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

/* --- API DEBUG STATE & CONTEXT (for logging API/network payloads and errors in UI) --- */
const ApiDebugContext = React.createContext();
function useApiDebug() {
  return React.useContext(ApiDebugContext);
}

/**
 * DEEP API DEBUG PANEL: displays network logs, raw responses, and error state for developer/user
 */
function ApiDebugPanel() {
  // API debug context contains last request, response, error
  const { request, response, error } = useApiDebug() || {};
  if (!request && !response && !error) return null;
  // Only show if something interesting happened
  return (
    <div style={{
      marginTop: 30,
      marginBottom: 22,
      border: "2px dashed #4056a1",
      borderRadius: 12,
      background: "#f6f9ff",
      color: "#162146",
      padding: "1.1em 1.1em 0.8em",
      fontSize: "1em",
      textAlign: "left",
      maxWidth: 900,
      overflowX: "auto",
      boxShadow: "0 1.5px 7px #8881"
    }}>
      <div style={{ fontWeight: 800, color: "#4056a1", fontSize: "1.06em", marginBottom: 2  }}>
        Debug/Network (API Log)
      </div>
      <div>
        <span style={{ fontWeight: 500 }}>Last Request:</span>
        <pre style={{ margin: 0, background: "#e6edf3", borderRadius: 7, fontSize: 13, padding: 8, overflowX: "auto" }}>
          {request ? JSON.stringify(request, null, 2) : "--"}
        </pre>
      </div>
      <div>
        <span style={{ fontWeight: 500 }}>Last Response:</span>
        <pre style={{ margin: 0, background: "#e6f3ea", borderRadius: 7, fontSize: 13, padding: 8, overflowX: "auto" }}>
          {response ? JSON.stringify(response, null, 2) : "--"}
        </pre>
      </div>
      <div>
        <span style={{ fontWeight: 500 }}>Error/Message:</span>
        <pre style={{ margin: 0, background: "#feeee8", borderRadius: 7, fontSize: 13, padding: 8, overflowX: "auto", color: "#ea4335" }}>
          {error ? String(error) : "--"}
        </pre>
        {/* For TheMealDB, no API key/quota errors expected */}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme] = useState("light"); // Future: support theme switch if needed
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientList, setIngredientList] = useState([]); // [{name, quantity, selected}]
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  // For API/network logs and errors (debug flows UI)
  const [apiDebug, setApiDebug] = useState({ request: null, response: null, error: null });

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
  // PUBLIC_INTERFACE
  // Handles API call to get live recipe suggestions from TheMealDB API (by ingredients)
  const handleFindRecipes = async () => {
    setLoading(true);
    setRecipes([]); // Clear old
    setSelectedRecipe(null);

    // Collect selected ingredients
    const includedIngredientsArr = ingredientList.filter((item) => item.selected);
    const includedIngredients = includedIngredientsArr
      .map((item) => item.name)
      .join(",");

    // API debug state: initialize/clear before run
    setApiDebug({ request: null, response: null, error: null });

    if (!includedIngredients) {
      setLoading(false);
      setApiDebug({
        request: null,
        response: null,
        error: "No included ingredients selected for search.",
      });
      alert("Please select at least one ingredient before searching for recipes.");
      return;
    }

    // TheMealDB: Lookup by ingredient only supports one at a time, we'll OR all
    // for demo, get matches for first ingredient only
    const firstIngredient = includedIngredientsArr[0].name;

    const apiListUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(firstIngredient)}`;
    let debugRequest = {
      type: "TheMealDB-multi-ingredient",
      url: apiListUrl,
      method: "GET",
      includedIngredients,
      headers: {},
      ingredientArray: includedIngredientsArr,
      ingredientInputField: ingredientInput,
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Search for meals containing first ingredient
      const resp = await fetch(apiListUrl);
      let respJson = await resp.json();
      setApiDebug({ request: debugRequest, response: respJson, error: null });

      if (!respJson.meals || respJson.meals.length === 0) {
        setRecipes([
          {
            id: "themealdb-no-results",
            name: "No Recipes Found",
            image: DUMMY_IMG,
            ingredients: [],
            steps: [],
            nutrition: null,
            tags: [],
            error: "No recipes found for these ingredients. Try fewer or different items.",
          },
        ]);
        setLoading(false);
        return;
      }

      // Only show 6 for UI (as formerly done)
      const topMeals = respJson.meals.slice(0, 6);

      // 2. Fetch detailed info (instructions etc) for each
      const details = await Promise.all(
        topMeals.map(async (item) => {
          try {
            const detailRes = await fetch(
              `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${item.idMeal}`
            );
            const detailJson = await detailRes.json();
            if (!detailJson.meals || !detailJson.meals[0]) throw new Error("No details found");
            const meal = detailJson.meals[0];

            // Instructions
            let steps = [];
            if (typeof meal.strInstructions === "string" && meal.strInstructions.trim()) {
              steps = meal.strInstructions
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter((s) => s.length > 2);
            }
            if (steps.length === 0) steps = ["Stepwise instructions not available."];

            // Ingredients - TheMealDB provides up to 20 manually
            let ingredients = [];
            for (let idx = 1; idx <= 20; idx++) {
              const nm = meal[`strIngredient${idx}`];
              const amt = meal[`strMeasure${idx}`];
              if (nm && nm.trim()) {
                ingredients.push(
                  `${nm.trim()}${amt && amt.trim() ? ` (${amt.trim()})` : ""}`
                );
              }
            }
            if (ingredients.length === 0)
              ingredients = ["Ingredients not available."];

            // Smart tags (basic heuristics)
            const tags = [];
            if ((meal.strTags || "").toLowerCase().includes("vegan")) tags.push("Vegan");
            if ((meal.strCategory || "").toLowerCase().includes("vegan")) tags.push("Vegan");
            if ((meal.strCategory || "").toLowerCase().includes("vegetarian")) tags.push("Vegan");
            if ((meal.strTags || "").toLowerCase().includes("healthy")) tags.push("Healthy");
            if ((meal.strMeal || "").toLowerCase().match(/fried|burger|chip|junk/)) tags.push("Junk");
            if ((meal.strMeal || "").toLowerCase().match(/protein/)) tags.push("High Protein");
            // no reliable way to estimate carbs/fats without nutrition

            // Always warn about lack of nutrition
            let nutrition = null;

            return {
              id: meal.idMeal,
              name: meal.strMeal,
              image: meal.strMealThumb,
              prep_time: meal.strArea || "--",
              ingredients,
              steps,
              nutrition, // null
              tags,
            };
          } catch (err) {
            return {
              id: item.idMeal,
              name: item.strMeal || "Recipe unavailable",
              image: item.strMealThumb,
              prep_time: "--",
              ingredients: ["Ingredients not available."],
              steps: ["Instructions not available."],
              nutrition: null,
              tags: [],
              error: "Could not load recipe details.",
            };
          }
        })
      );

      // Defensive: show message if all failed
      const clean = details.filter((r) => r && r.id && r.name);
      if (clean.length > 0) setRecipes(clean);
      else {
        setRecipes([
          {
            id: "themealdb-no-valid",
            name: "No Valid Recipes Found",
            image: DUMMY_IMG,
            ingredients: [],
            steps: [],
            nutrition: null,
            tags: [],
            error: "No complete recipes could be displayed for this search.",
          },
        ]);
      }
    } catch (e) {
      setRecipes([]);
      let message =
        "[API-LOG] ERROR in handleFindRecipes: " + (e?.message || String(e));
      setApiDebug((old) => ({
        ...(old || {}),
        error: message,
      }));
      setRecipes([
        {
          id: "fail",
          name: "Recipe Fetch failed!",
          image: DUMMY_IMG,
          ingredients: [],
          steps: [],
          nutrition: null,
          tags: [],
          error:
            "Failed to fetch recipes. " +
            (e?.message || "Unknown error occurred contacting TheMealDB."),
        },
      ]);
      alert(
        "Failed to fetch recipes. " +
          (e?.message
            ? e.message
            : "Unknown error occurred contacting TheMealDB.")
      );
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
            {/* User feedback for error state (if last run produced one) */}
            {!loading && recipes.length > 0 && recipes.every(r => r.error) && (
              <div
                style={{
                  color: "#ea4335",
                  background: "#fff0f0",
                  border: "1.5px solid #ea4335",
                  borderRadius: 8,
                  padding: "0.8em 1.1em",
                  marginBottom: 12,
                  fontWeight: 600
                }}
                aria-live="assertive"
              >
                {recipes[0].error || "Recipe fetch failed. Please check your API quota or try again later."}
              </div>
            )}
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
            {loading && (
              <div className="loading" aria-live="polite">
                Loading recipes from TheMealDB...
              </div>
            )}
            {!loading && recipes.length === 0 && (
              <div className="muted" aria-live="polite">
                No recipes to show. Try adding ingredients.
              </div>
            )}
            {/* Aggressive error/state display: if every recipe card is error, RecipeList will show user/developer error */}
            <RecipeList
              recipes={recipes}
              favorites={favorites}
              onOpen={(r) => setSelectedRecipe(r)}
              onFav={handleFavorite}
              isFav={isFavorite}
            />
          </section>
          {/* --- DEEP API DEBUG PANEL: show last raw Spoonacular API response and errors --- */}
          <ApiDebugPanel />
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

/*
  RecipeList: Display recipe cards, handling error states visually.
  - If every recipe has an error (e.g. API fail), show the error content with distinct styling.
  - Cleanly handles user/developer feedback for all fetch/UI mapping problems.
*/
function RecipeList({ recipes, onOpen, onFav, favorites, isFav }) {
  if (!recipes.length) return null;

  // If every recipe has .error, show special error display
  const allAreErrors =
    recipes.length > 0 && recipes.every((r) => r.error && typeof r.error === "string");
  if (allAreErrors) {
    return (
      <div className="recipe-list error-state">
        {recipes.map((r) => (
          <div className="recipe-card" key={r.id} style={{ border: "2.5px solid #ea4335" }}>
            <img
              src={r.image || DUMMY_IMG}
              className="recipe-thumb"
              alt={(r.name ? `${r.name} error` : "Recipe Error")}
              style={{ opacity: 0.55, pointerEvents: "none" }}
            />
            <div className="recipe-summary">
              <div
                className="recipe-card-title"
                style={{ color: "#ea4335", fontWeight: 900, marginBottom: "0.45em" }}
              >
                {r.name}
              </div>
              {r.error ? (
                <div style={{ color: "#bb2124", fontWeight: 700, margin: "0.7em 0" }}>
                  {r.error}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        <div className="muted" style={{ margin: "2.5em 0 1em", fontSize: "1.15em" }} aria-live="polite">
          <span>
            No valid recipes could be loaded from the server. <br />
            Please check your ingredients, or try again shortly.
          </span>
        </div>
      </div>
    );
  }

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
  // If no data, indicate in UI that nutrition is unavailable
  if (!nutrition) {
    return (
      <div className="nutrition-bars enhanced-nutrition" style={{ fontStyle: "italic", color: "#b12c2c", marginTop: 7 }}>
        Nutrition breakdown not available for this recipe.
      </div>
    );
  }
  // nutrition: {calories, carbs, fats, protein}
  const stats = [
    {
      key: "calories",
      label: "Calories",
      max: 700,
      getDisplay: v => `${v} kcal`,
      help: "Total calories (kcalories)",
    },
    {
      key: "carbs",
      label: "Carbs",
      max: 60,
      getDisplay: v => `${v} g`,
      help: "Carbohydrates (grams)",
    },
    {
      key: "fats",
      label: "Fats",
      max: 40,
      getDisplay: v => `${v} g`,
      help: "Fats (grams)",
    },
    {
      key: "protein",
      label: "Protein",
      max: 40,
      getDisplay: v => `${v} g`,
      help: "Protein (grams)",
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
                letterSpacing: stat.key === "calories" ? "0.5px" : "0",
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
                  position: "relative",
                }}
                aria-label={`${stat.label}: ${value}${stat.key === "calories" ? " kcal" : " g"}`}
              >
                {/* Value inside bar only for high %; else show outside */}
                {pct > 35 ? (
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
                  textAlign: "right",
                }}
              >
                {pct <= 35 ? stat.getDisplay(value) : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { ApiDebugContext };
export default App;
