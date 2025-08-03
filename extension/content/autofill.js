// Simple auto-fill content script for MisResultados and e-labresults

// Initialize content script
async function initializeContentScript() {
  // Only run on pages with control/license parameters
  const urlParams = new URLSearchParams(window.location.search);
  const hasControlParam = urlParams.has('controlnumber');
  const hasLicenseParam = urlParams.has('lablicense');

  if (hasControlParam && hasLicenseParam) {
    console.log('MisResultados Helper: Auto-fill parameters detected');
    // Wait for DOM to be ready, then show fill button
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showFillButton);
    } else {
      setTimeout(showFillButton, 500);
    }
  } else {
    console.log('MisResultados Helper: No auto-fill parameters found');
  }
}

// Start the extension
initializeContentScript();

/**
 * Show fill button for user to click
 */
async function showFillButton() {
  // Check if we have saved data first
  const data = await browser.storage.local.get(['patientName']);
  if (!data.patientName) {
    showStatus(browser.i18n.getMessage('noData'));
    return;
  }

  // Check if form fields exist
  const nameField = document.querySelector('input[name="patientLastName"]');
  if (!nameField) {
    console.log('MisResultados Helper: No compatible form found');
    return;
  }

  // Don't create button if it already exists
  if (document.querySelector('.mrh-button')) {
    return;
  }

  // Find the form or a good container near the form
  const form = nameField.closest('form') || nameField.closest('.container') || nameField.parentElement;

  const fillButton = document.createElement('button');
  fillButton.textContent = browser.i18n.getMessage('fillButton');
  fillButton.className = 'mrh-button';

  fillButton.addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Fill button clicked!');
    performAutoFill();
  });

  // Insert button just BEFORE the form to avoid form event issues
  form.parentNode.insertBefore(fillButton, form);
  
  console.log('Fill button created and placed before:', form);
}


async function performAutoFill() {
  try {
    // Get saved patient data
    const data = await browser.storage.local.get([
      'patientName',
      'birthDay',
      'birthMonth',
      'birthYear'
    ]);

    if (!data.patientName) {
      console.log('MisResultados Helper: No patient data saved');
      showStatus(browser.i18n.getMessage('noData'));
      return;
    }

    console.log('MisResultados Helper: Auto-filling form...');
    let fieldsFound = 0;

    // Fill patient name (works for both sites)
    const nameField = document.querySelector('input[name="patientLastName"]');
    if (nameField) {
      nameField.value = data.patientName;
      nameField.dispatchEvent(new Event('input', { bubbles: true }));
      nameField.dispatchEvent(new Event('change', { bubbles: true }));
      fieldsFound++;
    }

    // Fill birth date - Day (same field name on both sites)
    if (data.birthDay) {
      const dayField = document.querySelector('select[name="birthDateDia"]');
      if (dayField) {
        // Pad with zero if needed (e.g., "5" -> "05")
        const paddedDay = data.birthDay.toString().padStart(2, '0');
        dayField.value = paddedDay;
        dayField.dispatchEvent(new Event('change', { bubbles: true }));
        fieldsFound++;
      }
    }

    // Fill birth date - Month
    if (data.birthMonth) {
      const monthField = document.querySelector('select[name="birthDateMes"]');
      if (monthField) {
        // Pad with zero if needed (e.g., "5" -> "05")
        const paddedMonth = data.birthMonth.toString().padStart(2, '0');
        monthField.value = paddedMonth;
        monthField.dispatchEvent(new Event('change', { bubbles: true }));
        fieldsFound++;
      }
    }

    // Fill birth date - Year
    if (data.birthYear) {
      const yearField = document.querySelector('select[name="birthDateAnio"]');
      if (yearField) {
        yearField.value = data.birthYear;
        yearField.dispatchEvent(new Event('change', { bubbles: true }));
        fieldsFound++;
      }
    }

    // Check privacy policy checkbox
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const privacyCheckbox = Array.from(checkboxes).find(cb => {
      const labelText = cb.parentElement?.textContent?.toLowerCase() || '';
      return labelText.includes('privacy') ||
             labelText.includes('privacidad') ||
             labelText.includes('terms') ||
             labelText.includes('términos') ||
             labelText.includes('acepto');
    });

    if (privacyCheckbox && !privacyCheckbox.checked) {
      privacyCheckbox.checked = true;
      privacyCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      fieldsFound++;
    }

    // Update button text to show it worked
    const fillButton = document.querySelector('.mrh-button');
    if (fillButton) {
      fillButton.textContent = browser.i18n.getMessage('fillButtonDone');
      fillButton.style.background = '#2196F3 !important';
      setTimeout(() => {
        if (fillButton.parentNode) {
          fillButton.textContent = browser.i18n.getMessage('fillButton');
          fillButton.style.background = '';
        }
      }, 2000);
    }

    if (fieldsFound > 0) {
      console.log(`MisResultados Helper: Auto-filled ${fieldsFound} fields`);
      showStatus(browser.i18n.getMessage('autoFilled'), 'success');
    } else {
      console.log('MisResultados Helper: No matching form fields found');
      showStatus(browser.i18n.getMessage('noFields'), 'warning');
    }

  } catch (error) {
    console.error('MisResultados Helper: Error during auto-fill', error);
    showStatus(browser.i18n.getMessage('autoFillError') + error.message, 'error');
  }
}


function showStatus(message, type = 'info') {
  // Remove any existing status first
  const existing = document.querySelector('.mrh-status');
  if (existing) existing.remove();

  const statusDiv = document.createElement('div');
  statusDiv.className = `mrh-status mrh-status-${type}`;
  statusDiv.textContent = `MisResultados Helper: ${message}`;

  document.body.appendChild(statusDiv);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (statusDiv.parentNode) {
      statusDiv.style.opacity = '0';
      setTimeout(() => {
        if (statusDiv.parentNode) {
          statusDiv.remove();
        }
      }, 500);
    }
  }, 5000);
}

console.log('MisResultados Helper: Content script loaded');
