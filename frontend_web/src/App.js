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
  // Handles API call to get recipe suggestions
  const handleFindRecipes = async () => {
    setLoading(true);
    setRecipes([]); // Clear old
    setSelectedRecipe(null);

    // Build query for demo, here just mock the API response
    try {
      // Simulate REST API call
      // In real: const response = await fetch('/api/recipes?...')
      await new Promise((res) => setTimeout(res, 800));
      const mockRecipes = getMockRecipes(ingredientList);
      setRecipes(mockRecipes);
    } catch (e) {
      setRecipes([]);
      // eslint-disable-next-line
      alert("Failed to fetch recipes. (API not connected)");
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

// NutritionBars: shows color-coded bars for macronutrients
function NutritionBars({ nutrition, showLabels }) {
  // nutrition: {calories, carbs, fats, protein}
  if (!nutrition) return null;
  const stats = [
    { key: "calories", label: "Calories", max: 700 },
    { key: "carbs", label: "Carbs (g)", max: 60 },
    { key: "fats", label: "Fats (g)", max: 40 },
    { key: "protein", label: "Protein (g)", max: 40 },
  ];
  return (
    <div className="nutrition-bars">
      {stats.map((stat) => {
        const value = nutrition[stat.key] || 0;
        const pct = Math.min(100, Math.round((value / stat.max) * 100));
        return (
          <div className="nutrition-bar-row" key={stat.key}>
            {showLabels && (
              <div className="nutrition-bar-label">{stat.label}</div>
            )}
            <div className="nutrition-bar-tray">
              <div
                className="nutrition-bar"
                style={{
                  width: `${pct}%`,
                  backgroundColor: getBarColor(stat.key),
                }}
                aria-label={`${stat.label}: ${value}`}
              >
                <span className="nutrition-bar-text">{value}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- MOCK DATA / UTILITIES for UI Demo ---

function getMockRecipes(ingredients = []) {
  // This is dummy function. In production, call real API.
  // For mock: pretend each ingredient triggers a themed recipe plus one fun recipe.
  return [
    {
      id: "r1",
      name: "Tomato & Cheese Frittata",
      image: "https://source.unsplash.com/300x200/?frittata,egg,cheese",
      prep_time: 20,
      ingredients: ["Eggs", "Tomato", "Cheese", "Salt", "Pepper"],
      steps: [
        "Beat eggs and seasonings.",
        "Sauté tomato in a pan.",
        "Add eggs, top with cheese, cook until set."
      ],
      nutrition: { calories: 350, carbs: 8, fats: 24, protein: 19 },
      tags: ["Healthy", "Low-Carb", "High Protein"]
    },
    {
      id: "r2",
      name: "Crispy Veggie Wrap",
      image: "https://source.unsplash.com/300x200/?wrap,vegetable,food",
      prep_time: 15,
      ingredients: ["Tortilla", "Lettuce", "Veggies", "Hummus", "Pepper"],
      steps: [
        "Spread hummus on tortilla.",
        "Add veggies & lettuce.",
        "Wrap tightly and serve."
      ],
      nutrition: { calories: 300, carbs: 36, fats: 6, protein: 10 },
      tags: ["Vegan", "Healthy"]
    },
    {
      id: "r3",
      name: "Loaded Nachos",
      image: "https://source.unsplash.com/300x200/?nachos,junk-food",
      prep_time: 10,
      ingredients: ["Corn Chips", "Cheese", "Beans", "Salsa"],
      steps: [
        "Layer chips, beans, cheese, salsa.",
        "Microwave until cheese melts."
      ],
      nutrition: { calories: 520, carbs: 42, fats: 31, protein: 14 },
      tags: ["Junk", "Avoid for Diabetics", "High Protein"]
    },
  ];
}

export default App;
