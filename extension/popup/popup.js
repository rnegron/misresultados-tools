// Simple popup for saving patient data

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  updatePopupLanguage();
  populateDateSelectors();
  loadSavedData();
  setupEventListeners();
}

// Update popup UI with localized strings
function updatePopupLanguage() {
  document.querySelector('h1').textContent = browser.i18n.getMessage('extensionName');
  document.querySelector('label[for="patient-name"]').textContent = browser.i18n.getMessage('nameLabel');
  document.querySelector('#patient-name').placeholder = browser.i18n.getMessage('namePlaceholder');
  document.querySelector('label[for="birth-day"]').textContent = browser.i18n.getMessage('birthLabel');
  document.querySelector('#save-btn').textContent = browser.i18n.getMessage('saveButton');
  document.querySelector('#clear-btn').textContent = browser.i18n.getMessage('clearButton');
  
  // Update placeholders in date selectors
  document.querySelector('#birth-day option[value=""]').textContent = browser.i18n.getMessage('dayPlaceholder');
  document.querySelector('#birth-month option[value=""]').textContent = browser.i18n.getMessage('monthPlaceholder');
  document.querySelector('#birth-year option[value=""]').textContent = browser.i18n.getMessage('yearPlaceholder');
}

function populateDateSelectors() {
  const daySelect = document.getElementById('birth-day');
  const monthSelect = document.getElementById('birth-month');
  const yearSelect = document.getElementById('birth-year');

  // Days 1-31
  for (let day = 1; day <= 31; day++) {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day.toString().padStart(2, '0');
    daySelect.appendChild(option);
  }

  // Months (localized using i18n)
  const months = [
    browser.i18n.getMessage('monthJanuary'),
    browser.i18n.getMessage('monthFebruary'),
    browser.i18n.getMessage('monthMarch'),
    browser.i18n.getMessage('monthApril'),
    browser.i18n.getMessage('monthMay'),
    browser.i18n.getMessage('monthJune'),
    browser.i18n.getMessage('monthJuly'),
    browser.i18n.getMessage('monthAugust'),
    browser.i18n.getMessage('monthSeptember'),
    browser.i18n.getMessage('monthOctober'),
    browser.i18n.getMessage('monthNovember'),
    browser.i18n.getMessage('monthDecember')
  ];
       
  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index + 1;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  // Years (current year back to 1920)
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 1920; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

async function loadSavedData() {
  try {
    const data = await browser.storage.local.get([
      'patientName', 'birthDay', 'birthMonth', 'birthYear'
    ]);
    
    if (data.patientName) {
      document.getElementById('patient-name').value = data.patientName;
      document.getElementById('birth-day').value = data.birthDay || '';
      document.getElementById('birth-month').value = data.birthMonth || '';
      document.getElementById('birth-year').value = data.birthYear || '';
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function setupEventListeners() {
  document.getElementById('patient-form').addEventListener('submit', handleSave);
  document.getElementById('clear-btn').addEventListener('click', handleClear);
}


async function handleSave(event) {
  event.preventDefault();
  
  const name = document.getElementById('patient-name').value.trim();
  const day = document.getElementById('birth-day').value;
  const month = document.getElementById('birth-month').value;
  const year = document.getElementById('birth-year').value;
  
  if (!name || !day || !month || !year) {
    showStatus(browser.i18n.getMessage('completeFields'), 'error');
    return;
  }
  
  try {
    await browser.storage.local.set({
      patientName: name,
      birthDay: day,
      birthMonth: month,
      birthYear: year
    });
    showStatus(browser.i18n.getMessage('settingsSaved'), 'success');
  } catch (error) {
    console.error('Error saving:', error);
    showStatus(browser.i18n.getMessage('errorSaving'), 'error');
  }
}

async function handleClear() {
  try {
    await browser.storage.local.clear();
    document.getElementById('patient-name').value = '';
    document.getElementById('birth-day').value = '';
    document.getElementById('birth-month').value = '';
    document.getElementById('birth-year').value = '';
    showStatus(browser.i18n.getMessage('settingsCleared'), 'success');
  } catch (error) {
    console.error('Error clearing:', error);
    showStatus(browser.i18n.getMessage('errorClearing'), 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
}