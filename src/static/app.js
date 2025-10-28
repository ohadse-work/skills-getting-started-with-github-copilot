document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicated options on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML: show a bulleted list or a placeholder
        const participantsHtml = (details.participants && details.participants.length)
          ? `
            <div class="participants">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants.map(p => `
                  <li class="participant-item">
                    <span class="participant-name">${p}</span>
                    <button class="delete-participant" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}" title="Remove ${p}">✖</button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `
          : `
            <div class="participants">
              <strong>Participants:</strong>
              <p class="no-participants">No participants yet</p>
            </div>
          `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delegated click handler for delete buttons on this card
        activityCard.addEventListener("click", async (event) => {
          const btn = event.target.closest('.delete-participant');
          if (!btn) return;

          const email = btn.dataset.email;
          const activityName = btn.dataset.activity;

          if (!email || !activityName) return;

          // Confirm removal with the user
          const confirmRemoval = confirm(`Remove ${email} from ${activityName}?`);
          if (!confirmRemoval) return;

          try {
            const delResp = await fetch(`/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`, {
              method: 'DELETE',
            });

            const delResult = await delResp.json().catch(() => ({}));

            if (delResp.ok) {
              messageDiv.textContent = delResult.message || `${email} removed from ${activityName}`;
              messageDiv.className = 'message success';
              messageDiv.classList.remove('hidden');

              // Refresh the activities list and select options
              fetchActivities();
            } else {
              messageDiv.textContent = delResult.detail || delResult.message || 'Failed to remove participant';
              messageDiv.className = 'message error';
              messageDiv.classList.remove('hidden');
            }

            // Hide message after 5 seconds
            setTimeout(() => {
              messageDiv.classList.add('hidden');
            }, 5000);
          } catch (err) {
            console.error('Error removing participant:', err);
            messageDiv.textContent = 'Failed to remove participant. Try again.';
            messageDiv.className = 'message error';
            messageDiv.classList.remove('hidden');
          }
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
