const dropdown = document.getElementById('dropdown');
const searchInput = document.getElementById('searchInput');
const suggestionsDiv = document.getElementById('suggestions');
const infoDiv = document.getElementById('info');
const copyButton = document.getElementById('copyButton');
const injectButton = document.getElementById('injectButton');
const catButton = document.getElementById('catButton');

let combinedInfo = "";
let incidentOptions = [];
let originalData = [];

fetch('resolution.json')
  .then(response => response.json())
  .then(data => {
    originalData = data;
    incidentOptions = data.map(item => {
      return item["Incident Reported (In Remedy)"].includes("UNIX") 
        ? item["Incident Reported (In Remedy)"] 
        : item["PROBLEM REPORTED in Resolution Comment"];
    });
    populateDropdown(incidentOptions);
  })
  .catch(err => {
    console.error('Error loading JSON:', err);
    dropdown.innerHTML = '<option value="" disabled>Error loading options</option>';
  });

function populateDropdown(options) {
  dropdown.innerHTML = '<option value="" disabled selected>Select an option</option>';
  options.forEach((option, index) => {
    const optElement = document.createElement('option');
    optElement.value = index;
    optElement.textContent = option;
    dropdown.appendChild(optElement);
  });
}
// fetch('resolution.json')
//   .then(response => response.json())
//   .then(data => {
//     originalData = data;
//     incidentOptions = data.map(item => item["Incident Reported (In Remedy)"]);
//     populateDropdown(incidentOptions);
//   })
//   .catch(err => {
//     console.error('Error loading JSON:', err);
//     dropdown.innerHTML = '<option value="" disabled>Error loading options</option>';
//   });

// function populateDropdown(options) {
//   dropdown.innerHTML = '<option value="" disabled selected>Select an option</option>';
//   options.forEach((option, index) => {
//     const optElement = document.createElement('option');
//     optElement.value = index;
//     optElement.textContent = option;
//     dropdown.appendChild(optElement);
//   });
// }
function fetchRelatedInfo(selectedItem) {
  if (selectedItem) {
    const wic = prompt("Enter WIC:", "");
    const source = prompt("Enter Source:", "");

    combinedInfo = `Problem Reported: ${selectedItem["PROBLEM REPORTED in Resolution Comment"]}
Solution: ${selectedItem["SOLUTION in Resolution Comment(One liner summary)"]}
KBA Referred: ${selectedItem["KBA#"]}
Incident Specific Details: 
WIC: ${wic}
Source: ${source}
Resolution Steps: 
${selectedItem["Resolution Steps(Detailed steps followed to resolve the incident)"]}
Resolution Categorization: Service Request | User Awareness
Any Third Party/ Other Teams Involved: No
Name of Third Party/ Other Teams: `;

    infoDiv.textContent = combinedInfo;
  }
}


searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredData = originalData.filter(item =>
    item["Incident Reported (In Remedy)"].toLowerCase().includes(searchTerm)
  );

  if (filteredData.length > 0) {
    suggestionsDiv.style.display = 'block';
    suggestionsDiv.innerHTML = '';
    filteredData.forEach(item => {
      const suggestion = document.createElement('div');
      suggestion.textContent = item["Incident Reported (In Remedy)"];
      suggestion.addEventListener('click', () => {
        searchInput.value = item["Incident Reported (In Remedy)"];
        dropdown.value = originalData.indexOf(item); // Set the dropdown value to match the original index
        suggestionsDiv.style.display = 'none';
        fetchRelatedInfo(item); // Display the related info immediately
      });
      suggestionsDiv.appendChild(suggestion);
    });
  } else {
    suggestionsDiv.style.display = 'none';
  }
});

// searchInput.addEventListener('input', () => {
//   const searchTerm = searchInput.value.toLowerCase();
//   const filteredOptions = incidentOptions.filter(option =>
//     option.toLowerCase().includes(searchTerm)
//   );

//   if (filteredOptions.length > 0) {
//     suggestionsDiv.style.display = 'block';
//     suggestionsDiv.innerHTML = '';
//     filteredOptions.forEach((option, index) => {
//       const suggestion = document.createElement('div');
//       suggestion.textContent = option;
//       suggestion.addEventListener('click', () => {
//         searchInput.value = option;
//         dropdown.value = incidentOptions.indexOf(option);
//         suggestionsDiv.style.display = 'none';
//       });
//       suggestionsDiv.appendChild(suggestion);
//     });
//   } else {
//     suggestionsDiv.style.display = 'none';
//   }
// });

searchInput.addEventListener('blur', () => {
  setTimeout(() => (suggestionsDiv.style.display = 'none'), 200);
});

dropdown.addEventListener('change', () => {
  const selectedIndex = parseInt(dropdown.value, 10);
  const selectedItem = originalData[selectedIndex];
  if (selectedItem) {
    const wic = prompt("Enter WIC:", "");
    const source = prompt("Enter Source:", "");

    combinedInfo = `Problem Reported: ${selectedItem["PROBLEM REPORTED in Resolution Comment"]}
Solution: ${selectedItem["SOLUTION in Resolution Comment(One liner summary)"]}
KBA Referred: ${selectedItem["KBA#"]}
Incident Specific Details: 
WIC: ${wic}
Source: ${source}
Resolution Steps: 
${selectedItem["Resolution Steps(Detailed steps followed to resolve the incident)"]}
Resolution Categorization: Service Request | User Awareness
Any Third Party/ Other Teams Involved: No
Name of Third Party/ Other Teams: `;

    infoDiv.textContent = combinedInfo;
  }
});

copyButton.addEventListener('click', () => {
  navigator.clipboard.writeText(combinedInfo).then(() => {
    alert('Information copied to clipboard!');
  }).catch(err => {
    console.error('Error copying to clipboard:', err);
  });
});
injectButton.addEventListener('click', async () => {
  if (!combinedInfo) {
    alert('Please select an option and fill in details first!');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes("https://walgreens.onbmc.com")) {
      alert("Please navigate to the Walgreens page before using this feature.");
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (info) => {
        const textarea = document.querySelector('textarea.text#arid_WIN_4_1000000156');
        if (textarea) {
          textarea.value = info;
          
          // Create input and change events
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });

          // Dispatch events to notify the application
          textarea.dispatchEvent(inputEvent);
          textarea.dispatchEvent(changeEvent);
        } else {
          alert('Textarea with ID "arid_WIN_4_1000000156" not found!');
        }
      },
      args: [combinedInfo],
    });

    alert('Text injected into the textarea!');
  } catch (err) {
    console.error('Error injecting text:', err);
  }
});

// injectButton.addEventListener('click', async () => {
//   if (!combinedInfo) {
//     alert('Please select an option and fill in details first!');
//     return;
//   }

//   try {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     if (!tab.url.includes("https://walgreens.onbmc.com")) {
//       alert("Please navigate to the Walgreens page before using this feature.");
//       return;
//     }

//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       func: (info) => {
//         const textarea = document.querySelector('textarea.text#arid_WIN_4_1000000156');
//         if (textarea) {
//           textarea.value = info;
//         } else {
//           alert('Textarea with ID "arid_WIN_4_1000000156" not found!');
//         }
//       },
//       args: [combinedInfo],
//     });

//     alert('Text injected into the textarea!');
//   } catch (err) {
//     console.error('Error injecting text:', err);
//   }
// });

catButton.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes("https://walgreens.onbmc.com")) {
      alert("This feature is currently disabled, Kindly contact your admin");
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Click Categorization button
        const categorizationButton = document.querySelector('a.btn.f1');
        if (categorizationButton) {
          categorizationButton.click();
        }

        // Click ResCategorization button
        const resCategorizationButton = document.querySelector('a#WIN_4_304287770');
        if (resCategorizationButton) {
          resCategorizationButton.click();
        }

        // Select Request
        const requestMenuButton = document.querySelector('a.btn.btn3d.menu[style*="top:22px; left:185px;"]');
        if (requestMenuButton) {
          requestMenuButton.click();
          setTimeout(() => {
            const requestOption = document.querySelector('td.MenuEntryNoSub[arvalue="Request"]');
            if (requestOption) {
              requestOption.click();
            }
          }, 500);
        }

        // Select Software
        const softwareMenuButton = document.querySelector('a.btn.btn3d.menu[style*="top:20px; left:185px;"]');
        if (softwareMenuButton) {
          softwareMenuButton.click();
          setTimeout(() => {
            const softwareOption = document.querySelector('td.MenuEntryName[nowrap]:nth-child(2)');
            if (softwareOption) {
              softwareOption.click();
            }
          }, 500);
        }

        // Select Maintenance
        const maintenanceMenuButton = document.querySelector('a.btn.btn3d.menu[style*="top:24px; left:185px;"]');
        if (maintenanceMenuButton) {
          maintenanceMenuButton.click();
          setTimeout(() => {
            const maintenanceOption = document.querySelector('td.MenuEntryNameHover[nowrap]');
            if (maintenanceOption) {
              maintenanceOption.click();
            }
          }, 500);
        }
      },
    });

    alert('Categorization completed successfully!');
  } catch (err) {
    console.error('Error during categorization:', err);
  }
});
// function dropArea(){
  const dropTglBtn = document.getElementById('update-btn');
  const dropArea = document.getElementById('drop-area');

  dropTglBtn.addEventListener('click', () => {
    dropArea.classList.toggle('show');    
  })
// }
function contact(){
  alert('Contact your admin/developer');
}
// =====================
// const dropdown = document.getElementById('dropdown');
// const searchInput = document.getElementById('searchInput');
// const infoDiv = document.getElementById('info');
// const copyButton = document.getElementById('copyButton');
// const injectButton = document.getElementById('injectButton');
// const catButton = document.getElementById('catButton');
// let combinedInfo = "";
// let incidentOptions = [];
// let originalData = [];
// let filteredData = []; // To store the filtered data

// // Load options dynamically from the JSON file
// fetch('resolution.json')
//   .then(response => response.json())
//   .then(data => {
//     originalData = data;
//     incidentOptions = data.map(item => item["Incident Reported (In Remedy)"]);
//     populateDropdown(incidentOptions);
//   })
//   .catch(err => {
//     console.error('Error loading JSON:', err);
//     dropdown.innerHTML = '<option value="" disabled>Error loading options</option>';
//   });

//   function populateDropdown(options, originalIndexes) {
//     dropdown.innerHTML = '<option value="" disabled selected>Select an option</option>';
//     options.forEach((option, index) => {
//       const optElement = document.createElement('option');
//       optElement.value = originalIndexes[index]; // Use original index for selection
//       optElement.textContent = option;
//       dropdown.appendChild(optElement);
//     });
//   }
  
//   searchInput.addEventListener('input', () => {
//     const searchTerm = searchInput.value.toLowerCase();
//     filteredData = originalData.filter(item =>
//       item["Incident Reported (In Remedy)"].toLowerCase().includes(searchTerm)
//     );
//     const filteredOptions = filteredData.map(item => item["Incident Reported (In Remedy)"]);
  
//     // Populate dropdown with filtered results and their original indexes
//     const originalIndexes = filteredData.map(item => originalData.indexOf(item));
//     populateDropdown(filteredOptions, originalIndexes);
  
//     if (filteredOptions.length > 0) {
//       dropdown.style.animation = "fade-in 0.3s ease-in-out";
//       setTimeout(() => (dropdown.style.animation = ""), 300);
//     }
//   });
  
// // function populateDropdown(options) {
// //   dropdown.innerHTML = '<option value="" disabled selected>Select an option</option>';
// //   options.forEach((option, index) => {
// //     const optElement = document.createElement('option');
// //     optElement.value = index;
// //     optElement.textContent = option;
// //     dropdown.appendChild(optElement);
// //   });
// // }

// // searchInput.addEventListener('input', () => {
// //   const searchTerm = searchInput.value.toLowerCase();
// //   const filteredOptions = incidentOptions.filter(option =>
// //     option.toLowerCase().includes(searchTerm)
// //   );

// //   populateDropdown(filteredOptions);

// //   if (filteredOptions.length > 0) {
// //     dropdown.style.animation = "fade-in 0.3s ease-in-out";
// //     setTimeout(() => dropdown.style.animation = "", 300);
// //   }
// // });

// dropdown.addEventListener('change', () => {
//   const selectedIndex = parseInt(dropdown.value, 10);
//   const selectedItem = originalData[selectedIndex];
//   if (selectedItem) {
//     const wic = prompt("Enter WIC:", "");
//     const source = prompt("Enter Source:", "");

//     combinedInfo = `Problem Reported: ${selectedItem["PROBLEM REPORTED in Resolution Comment"]}
// Solution: ${selectedItem["SOLUTION in Resolution Comment(One liner summary)"]}
// KBA Referred: ${selectedItem["KBA#"]}
// Incident Specific Details: 
// WIC: ${wic}
// Source: ${source}
// Resolution Steps: 
// ${selectedItem["Resolution Steps(Detailed steps followed to resolve the incident)"]}
// Resolution Categorization: Service Request | User Awareness
// Any Third Party/ Other Teams Involved: No
// Name of Third Party/ Other Teams: `;

//     infoDiv.textContent = combinedInfo;
//   }
// });

// copyButton.addEventListener('click', () => {
//   navigator.clipboard.writeText(combinedInfo).then(() => {
//     alert('Information copied to clipboard!');
//   }).catch(err => {
//     console.error('Error copying to clipboard:', err);
//   });
// });

// injectButton.addEventListener('click', async () => {
//   if (!combinedInfo) {
//     alert('Please select an option and fill in details first!');
//     return;
//   }

//   try {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     if (!tab.url.includes("https://walgreens.onbmc.com")) {
//       alert("Please navigate to the Walgreens page before using this feature.");
//       return;
//     }

//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       func: (info) => {
//         const textarea = document.querySelector('textarea.text#arid_WIN_4_1000000156');
//         if (textarea) {
//           textarea.value = info;
//         } else {
//           alert('Textarea with ID "arid_WIN_4_1000000156" not found!');
//         }
//       },
//       args: [combinedInfo],
//     });

//     alert('Text injected into the textarea!');
//   } catch (err) {
//     console.error('Error injecting text:', err);
//   }
// });

// catButton.addEventListener('click', async () => {
//   try {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     if (!tab.url.includes("https://walgreens.onbmc.com")) {
//       alert("Please navigate to the Walgreens page before using this feature.");
//       return;
//     }

//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       func: () => {
//         // Click Categorization button
//         const categorizationButton = document.querySelector('a.btn.f1');
//         if (categorizationButton) {
//           categorizationButton.click();
//         }

//         // Click ResCategorization button
//         const resCategorizationButton = document.querySelector('a#WIN_4_304287770');
//         if (resCategorizationButton) {
//           resCategorizationButton.click();
//         }

//         // Select Request
//         const requestMenuButton = document.querySelector('a.btn.btn3d.menu[style*="top:22px; left:185px;"]');
//         if (requestMenuButton) {
//           requestMenuButton.click();
//           setTimeout(() => {
//             const requestOption = document.querySelector('td.MenuEntryNoSub[arvalue="Request"]');
//             if (requestOption) {
//               requestOption.click();
//             }
//           }, 500);
//         }

//         // Select Software
//         const softwareMenuButton = document.querySelector('a.btn.btn3d.menu[style*="top:20px; left:185px;"]');
//         if (softwareMenuButton) {
//           softwareMenuButton.click();
//           setTimeout(() => {
//             const softwareOption = document.querySelector('td.MenuEntryName[nowrap]:nth-child(2)');
//             if (softwareOption) {
//               softwareOption.click();
//             }
//           }, 500);
//         }

//         // Select Maintenance
//         const maintenanceMenuButton = document.querySelector('a.btn.btn3d.menu[style*="top:24px; left:185px;"]');
//         if (maintenanceMenuButton) {
//           maintenanceMenuButton.click();
//           setTimeout(() => {
//             const maintenanceOption = document.querySelector('td.MenuEntryNameHover[nowrap]');
//             if (maintenanceOption) {
//               maintenanceOption.click();
//             }
//           }, 500);
//         }
//       },
//     });

//     alert('Categorization completed successfully!');
//   } catch (err) {
//     console.error('Error during categorization:', err);
//   }
// });