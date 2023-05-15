const PAGE_SIZE = 10
let currentPage = 1;
let pokemons = [];
let filteredPokemon = [];

const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty()

  const maxPages = 5
  const pageRange = Math.min(maxPages, numPages)
  const middlePage = Math.ceil(pageRange / 2)

  let startPage = currentPage - middlePage + 1
  let endPage = startPage + pageRange - 1

  console.log(`Pages: ${numPages}`)

  if (endPage > numPages) {
    endPage = numPages
    startPage = endPage - pageRange + 1
  }

  if (startPage < 1) {
    startPage = 1
    endPage = startPage + pageRange - 1
  }

  for (let i = startPage; i <= endPage; i++) {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons ${i === currentPage ? 'active' : ''}" value="${i}">${i}</button>
    `)
  }

  // Display next and previous buttons
  if (currentPage > 1) {
    $('#pagination').prepend(`
      <button class="btn btn-primary page mr-1 previousButton" value="${currentPage - 1}">Previous</button>
    `)
  }

  if (currentPage < numPages) {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 nextButton" value="${currentPage + 1}">Next</button>
    `)
  }

  // Hide next and previous buttons when there is no next or previous page
  if (currentPage === 1) {
    $('.previousButton').hide()
  } else {
    $('.previousButton').show()
  }

  if (currentPage === numPages) {
    $('.nextButton').hide()
  } else {
    $('.nextButton').show()
  }

  // Display total number of Pokémons and the number of Pokémon being displayed
  const startIdx = (currentPage - 1) * PAGE_SIZE + 1
  const endIdx = Math.min(startIdx + PAGE_SIZE - 1, filteredPokemon.length)
  if (filteredPokemon.length === 0) {
    $('#pokeCounts').text('No Pokemons to display')
  } else {
    $('#pokeCounts').text(`Displaying ${startIdx}-${endIdx} of ${filteredPokemon.length} Pokemons`)
  }

}

const paginate = async (currentPage, PAGE_SIZE, filteredPokemon) => {
  $('#pokeCards').empty();

  const selected_pokemons = filteredPokemon.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const requests = selected_pokemons.map(async (pokemon) => {
    const res = await axios.get(pokemon.url);
    return res.data;
  });
  const results = await Promise.all(requests);
  results.forEach((pokemon) => {
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${pokemon.name}   >
        <h3>${pokemon.name.toUpperCase()}</h3> 
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>  
    `);
  });
};


const getPokemonTypes = async () => {
  try {
    const response = await axios.get('https://pokeapi.co/api/v2/type');
    const types = response.data.results;
    return types.map(type => type.name);
  } catch (error) {
    console.error(error);
  }
};

const filterPokemonByType = (selectedTypes, pokemons) => {
  // if no types are selected, return all pokemons
  if (selectedTypes.length === 0) {
    console.log('No types selected');
    return pokemons;
  }
  console.log(`Filtering pokemons by ${selectedTypes}`);

  // filter pokemons based on selected types
  const filtered = pokemons.filter(pokemon => {
    const result = selectedTypes.every(type => pokemon.types.map(type => type.type.name).includes(type));
    return result;
  });
  console.log(`Filtered ${pokemons.length} pokemons to ${filtered.length} pokemons`);
  return filtered;
};

const setup = async () => {

  // fetch and store pokemon data from PokeAPI using axios
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;

  // fetch and store detailed pokemon data from PokeAPI using axios
  for (let i = 0; i < pokemons.length; i++) {
    const pokemonResponse = await axios.get(pokemons[i].url);
    pokemons[i] = {
      ...pokemons[i],
      ...pokemonResponse.data
    };
  }

  filteredPokemon = pokemons;

  // create checkbox group for pokemon types
  const types = await getPokemonTypes();
  const typeCheckboxes = types.map(type => `
  <input type="checkbox" id="type-${type}" name="type" value="${type}">
  <label for="type-${type}">${type.toUpperCase()}</label>
`).join('');
  $('#types').html(typeCheckboxes);


  // display all pokemon cards and pagination buttons
  paginate(currentPage, PAGE_SIZE, filteredPokemon);
  const numPages = Math.ceil(filteredPokemon.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);

  // filter pokemon cards based on selected types
  $('body').on('change', 'input[type="checkbox"][name="type"]', function (e) {
    const selectedTypes = $('input[type="checkbox"][name="type"]:checked').map(function () {
      return $(this).val();
    }).get();
    filteredPokemon = filterPokemonByType(selectedTypes, pokemons);
    paginate(currentPage, PAGE_SIZE, filteredPokemon);
    const numPages = Math.ceil(filteredPokemon.length / PAGE_SIZE);
    updatePaginationDiv(1, numPages);
  });

  $('body').on('click', '.numberedButtons, .previousButton, .nextButton', function (e) {
    currentPage = Number(e.target.value);
    const selectedTypes = $('input[type="checkbox"][name="type"]:checked').map(function () {
      return $(this).val();
    }).get();
    const filteredPokemon = filterPokemonByType(selectedTypes, pokemons);
    paginate(currentPage, PAGE_SIZE, filteredPokemon);
    const numPages = Math.ceil(filteredPokemon.length / PAGE_SIZE);
    updatePaginationDiv(currentPage, numPages);
  });




  // add event listener to each pokemon card to display details modal
  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName');
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const types = res.data.types.map(type => type.type.name);
    $('.modal-body').html(`
      <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
          <h3>Abilities</h3>
          <ul>
            ${res.data.abilities.map(ability => `<li>${ability.ability.name}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h3>Stats</h3>
          <ul>
            ${res.data.stats.map(stat => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
          </ul>
        </div>
      </div>
      <h3>Types</h3>
      <ul>
        ${types.map(type => `<li>${type}</li>`).join('')}
      </ul>
    `);
    $('.modal-title').html(`
      <h2>${res.data.name.toUpperCase()}</h2>
      <h5>${res.data.id}</h5>
    `);
  });

};

$(document).ready(setup)