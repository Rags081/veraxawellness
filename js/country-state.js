const countryStatePairs = [
    { country: 'billingCountry', state: 'billingState' },
    { country: 'shippingCountry', state: 'shippingState' }
  ];
  
  // console.log(,window.allStates);
  
  
  const allCountries = window.allCountries;
  
  let country_state_exists = funnel_config.available_country_state?.length || 0;
  if(country_state_exists>0){
    let available_country_state =  JSON.parse(funnel_config.available_country_state)
    let allowed_country_codes = Object.keys(available_country_state)
  // Filter only allowed countries
  const selectedCountries = allCountries.filter(c => allowed_country_codes.includes(c.isoCode));
  // Loop through both billing and shipping
  countryStatePairs.forEach(({ country, state }) => {
    const $countryEl = $(`#${country}`);
    const $stateEl = $(`#${state}`);
    if ($countryEl.length === 0 || $stateEl.length === 0) return;
    // --- Populate countries ---
    let countryHtml = `<option value="" selected="selected">Select Country</option>`;
    const selectedCountry = $countryEl.data('selected');
    selectedCountries.forEach(c => {
      const selectedAttr = c.isoCode === selectedCountry ? 'selected="selected"' : '';
      countryHtml += `<option value="${c.isoCode}" ${selectedAttr}>${c.name}</option>`;
    });
    $countryEl.html(countryHtml);
    // --- Populate states if country preselected ---
    if (selectedCountry) {
      populateStatesByCountryCode(selectedCountry,available_country_state,$stateEl);
    }
    // --- On Country Change ---
    $countryEl.on('change', function (ev) {
      const iso = ev.target.value;
      if (!iso) return;
      populateStatesByCountryCode(iso,available_country_state,$stateEl);
  
    });
  });
  }
  
  function checkIslandStates(state_name){
         const islandKeywords = [
            'island',
            'islands',
            'atoll',
            'samoa',
            'guam',
            'puerto rico',
            'virgin islands',
            'outlying'
         ];   
         let islandCheck = islandKeywords.some(keyword=>{
            return state_name.toLowerCase().includes(keyword);  
         })
  
         
         if(islandCheck)
         {
            // Skip island/territory states
            return true;              
         }
  
         return false;
  }
  
  function checkArmedStates(state_name){
         const keywords = [
            'Armed Forces',
         ];   
         let armedForcesCheck = keywords.some(keyword=>{
            return state_name.toLowerCase().includes(keyword);  
         })
  
         
         if(armedForcesCheck)
         {
            return true;              
         }
  
         return false;
  }
  
  function includeArmedForcesStates(){
   return [
      { name: "Armed Forces Americas", isoCode: "AA",countryCode:"US" },
      { name: "Armed Forces Europe", isoCode: "AE-E",countryCode:"US" },
      { name: "Armed Forces Pacific", isoCode: "AP",countryCode:"US" },
      { name: "Armed Forces Africa", isoCode: "AE-A",countryCode:"US" },
      { name: "Armed Forces Canada", isoCode: "AE-C",countryCode:"US" },
      { name: "Armed Forces Middle East", isoCode: "AE-M",countryCode:"US" },
  
   ];
  }
  
  function populateStatesByCountryCode(country_code,available_country_state,$stateEl){
      const allowedStateCodes = available_country_state[country_code] || [];
     //  let states = State.getStatesOfCountry(country_code);
      let states = window.allStates.filter(state => {
        return state.countryCode == country_code;
      });
      let stateHtml = `<option value="" selected="selected">Select State</option>`;
  
      const merged = [
      ...new Map([...states].map(s => [s.isoCode, s])).values()
      ];      
      
      let finalStateList = [];
  
      merged.forEach(s => {
         
      
        if (allowedStateCodes.includes(s.isoCode)) {
          
         if(checkIslandStates(s.name) && funnel_config.block_orders_from_territory == 1){
            // Skip island/territory states
            return;              
         }
         finalStateList.push(s)
        }
      });
      
      let armedStates = includeArmedForcesStates();
  
      if(funnel_config.block_orders_from_army_base != 1)
      {
          armedStates.forEach(s => {
             finalStateList.push(s)        
          })
      }
      finalStateList.sort((a, b) => a.name.localeCompare(b.name));
      
      finalStateList.forEach(s => {
          stateHtml += `<option value="${s.isoCode}">${s.name}</option>`;
      })    
  
      $stateEl.html(stateHtml);
  
  }
  