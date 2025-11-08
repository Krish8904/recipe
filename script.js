const recipeList = document.getElementById("recipeList");
const searchInput = document.getElementById("search");
const addBtn = document.getElementById("addBtn");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");

// Store user‐added recipes to localStorage
const userRecipes = JSON.parse(localStorage.getItem("userRecipes")) || [];

// Function to fetch Indian meals via API
async function loadIndianRecipes() {
  try {
    const resp = await fetch("https://www.themealdb.com/api/json/v1/1/filter.php?a=Indian");
    const data = await resp.json();
    const meals = data.meals || [];
    // For each meal get full details
    const detailsPromises = meals.map(m =>
      fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`)
        .then(r => r.json())
        .then(rj => rj.meals[0])
    );
    const fullMeals = await Promise.all(detailsPromises);
    return fullMeals;
  } catch (err) {
    console.error("Error loading Indian recipes:", err);
    return [];
  }
}

// Render list of recipes (API + user)
async function renderRecipes() {
  const indianRecipes = await loadIndianRecipes();
  const allRecipes = [...indianRecipes, ...userRecipes];
  recipeList.innerHTML = "";
  allRecipes.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
      <h3>${recipe.strMeal}</h3>
    `;
    card.onclick = () => openModal(recipe);
    recipeList.appendChild(card);
  });
}

// Modal open
function openModal(recipe) {
  modal.style.display = "flex";
  document.getElementById("modalTitle").textContent = recipe.strMeal;
  document.getElementById("modalImg").src = recipe.strMealThumb;
  const ingListEl = document.getElementById("modalIngredients");
  ingListEl.innerHTML = "";
  // collect ingredients & measures
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const meas = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) {
      const li = document.createElement("li");
      li.textContent = `${meas.trim()} ${ing.trim()}`;
      ingListEl.appendChild(li);
    }
  }
  document.getElementById("modalSteps").textContent = recipe.strInstructions;
}

// Close modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target == modal) modal.style.display = "none"; };

// Add user recipe
addBtn.onclick = () => {
  const name = document.getElementById("name").value.trim();
  const ingredients = document.getElementById("ingredients").value.trim();
  const steps = document.getElementById("steps").value.trim();
  const imageInput = document.getElementById("image").files[0];

  if (!name || !ingredients || !steps || !imageInput) {
    alert("Fill all fields and upload image");
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const newRec = {
      strMeal: name,
      strMealThumb: e.target.result,
      strInstructions: steps,
      strIngredient1: ingredients,
      // you could split and assign more ingredient properties to keep structure
    };
    userRecipes.push(newRec);
    localStorage.setItem("userRecipes", JSON.stringify(userRecipes));
    renderRecipes();
    document.getElementById("name").value = "";
    document.getElementById("ingredients").value = "";
    document.getElementById("steps").value = "";
    document.getElementById("image").value = "";
  };
  reader.readAsDataURL(imageInput);
};

// Search
searchInput.oninput = async e => {
  const q = e.target.value.toLowerCase();
  const indianRecipes = await loadIndianRecipes();
  const allRecipes = [...indianRecipes, ...userRecipes];
  const filtered = allRecipes.filter(r =>
    r.strMeal.toLowerCase().includes(q) ||
    (r.strIngredient1 && r.strIngredient1.toLowerCase().includes(q))
  );
  recipeList.innerHTML = "";
  filtered.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
      <h3>${recipe.strMeal}</h3>
    `;
    card.onclick = () => openModal(recipe);
    recipeList.appendChild(card);
  });
};

// Initial call
renderRecipes();
