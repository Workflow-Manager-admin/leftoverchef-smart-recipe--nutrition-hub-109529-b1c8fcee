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
  // Handles API call to get live recipe suggestions from Spoonacular API
  const handleFindRecipes = async () => {
    setLoading(true);
    setRecipes([]); // Clear old
    setSelectedRecipe(null);

    // Prepare ingredient list for query
    const includedIngredients = ingredientList
      .filter((item) => item.selected)
      .map((item) => item.name)
      .join(",");

    const apiKey = process.env.REACT_APP_SPOONACULAR_API_KEY;

    // Fetch from Spoonacular API (returning recipes with images and details)
    try {
      // Step 1: Search for recipes matching ingredients
      const searchResp = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?includeIngredients=${encodeURIComponent(
          includedIngredients
        )}&number=6&addRecipeInformation=true&instructionsRequired=true&fillIngredients=true&apiKey=${apiKey}`
      );
      if (!searchResp.ok) throw new Error("API connection failed");
      const searchData = await searchResp.json();
      // Step 2: For each recipe, fetch details including instructions if needed
      const recipesData = await Promise.all(
        (searchData.results || []).map(async (recipe) => {
          // Instructions are included if addRecipeInformation=true, otherwise fetch details:
          let recipeDetails = recipe;
          if (!recipe.analyzedInstructions || recipe.analyzedInstructions.length === 0) {
            // Get details endpoint as fallback
            const detailResp = await fetch(
              `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${apiKey}`
            );
            recipeDetails = await detailResp.json();
          }
          // Compose steps/instructions
          let steps = [];
          if (recipeDetails.analyzedInstructions && recipeDetails.analyzedInstructions.length > 0) {
            steps =
              recipeDetails.analyzedInstructions[0].steps.map((s) => s.step) ||
              [];
          } else if (typeof recipeDetails.instructions === "string") {
            // Fallback: split by periods if no structured instructions
            steps =
              recipeDetails.instructions
                .split(/(?<=\.)\s+/)
                .filter((s) => s.trim().length > 0);
          }
          // Compose nutrition information: use "nutrition" if present, otherwise estimate basic macros
          let nutrition = { calories: 0, carbs: 0, fats: 0, protein: 0 };
          if (
            recipeDetails.nutrition &&
            recipeDetails.nutrition.nutrients
          ) {
            for (const n of recipeDetails.nutrition.nutrients) {
              if (n.name.toLowerCase().includes("calories")) nutrition.calories = Math.round(n.amount);
              if (n.name.toLowerCase().includes("carbohydrate")) nutrition.carbs = Math.round(n.amount);
              if (n.name.toLowerCase().includes("fat")) nutrition.fats = Math.round(n.amount);
              if (n.name.toLowerCase().includes("protein")) nutrition.protein = Math.round(n.amount);
            }
          } else if (recipeDetails.calories) {
            // Sometimes calories is available as a top-level field
            nutrition.calories = Math.round(recipeDetails.calories);
          }
          // Prepare smart tags as a basic example (could be improved with more analysis)
          const lowerTitle = (recipeDetails.title || "").toLowerCase();
          const tags = [];
          if (recipeDetails.vegetarian) tags.push("Vegan");
          if (nutrition.carbs < 25) tags.push("Low-Carb");
          if (nutrition.protein > 15) tags.push("High Protein");
          if (nutrition.calories < 350) tags.push("Healthy");
          if (/nachos|fries|burger|chip|fried|junk/.test(lowerTitle)) tags.push("Junk");
          if (
            /sugar|syrup|honey|sweet|dessert|pie|cake/.test(lowerTitle) ||
            nutrition.carbs > 35
          )
            tags.push("Avoid for Diabetics");

          return {
            id: recipeDetails.id,
            name: recipeDetails.title,
            image: recipeDetails.image,
            prep_time:
              recipeDetails.readyInMinutes || recipeDetails.preparationMinutes || "--",
            ingredients:
              recipeDetails.extendedIngredients && recipeDetails.extendedIngredients.length > 0
                ? recipeDetails.extendedIngredients.map(
                    (i) =>
                      `${i.original || i.name} ${
                        i.amount
                          ? `(${Number(i.amount).toFixed(1)}${i.unit ? " " + i.unit : ""})`
                          : ""
                      }`
                  )
                : recipeDetails.ingredients ||
                  (recipeDetails.summary ? [recipeDetails.summary] : []),
            steps: steps.length > 0 ? steps : ["Instructions not available."],
            nutrition,
            tags,
          };
        })
      );
      setRecipes(recipesData);
    } catch (e) {
      setRecipes([]);
      // eslint-disable-next-line
      alert("Failed to fetch recipes. The Spoonacular API may have reached its quota or key is invalid.");
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

// RecipeDetailsModal: Shows selected recipe in detail
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
        <SmartTags tags={recipe.tags} />
        <div className="modal-subtext">
          <span>Prep time: {recipe.prep_time} min</span>
        </div>
        <h4>Ingredients:</h4>
        <ul className="modal-ingredients-list">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx}>{ing}</li>
          ))}
        </ul>
        <h4>Instructions:</h4>
        <ol className="modal-steps">
          {recipe.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
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
