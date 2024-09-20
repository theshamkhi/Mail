document.addEventListener('DOMContentLoaded', () => {

  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#send-button').addEventListener('click', send_email);
  

  const mailboxButtons = document.querySelectorAll('.nav-link');
    
  // Function to remove the "selected" class from all buttons
  function removeSelectedClass() {
      mailboxButtons.forEach(button => button.classList.remove('selected'));
  }

  mailboxButtons.forEach(button => {
      button.addEventListener('click', () => {
          removeSelectedClass();
          button.classList.add('selected');
      });
  });


  // Load the inbox by default
  load_mailbox('inbox');
});

// Function to display the compose email view
function compose_email() {

  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id, mailbox) {

  const emailView = document.querySelector('#email-view');
  emailView.innerHTML = '';

  fetch(`/emails/${id}`)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Failed to fetch email details');
      }
    })
    .then((email) => {

      document.querySelector('#emails-view').style.display = 'none';
      emailView.style.display = 'block';

      // Create a card container for the email
      const emailCard = document.createElement('div');
      emailCard.classList.add('card', 'shadow', 'bg-transparent', 'mx-auto', 'mb-3');
      emailCard.style.maxWidth = '700px';
      emailCard.style.borderRadius = '14px';

      // Create the card-header for the email
      const emailHeader = document.createElement('div');
      emailHeader.classList.add('card-header', 'bg-transparent', 'd-flex', 'flex-column', 'justify-content-center');
      emailHeader.style.padding = '0 24px';
      emailHeader.style.paddingTop = '24px';
      emailHeader.style.paddingBottom = '14px';

      // Create the email-title element (Subject)
      const emailTitle = document.createElement('h2');
      emailTitle.classList.add('mb-3');
      emailTitle.innerText = email.subject;
      emailHeader.appendChild(emailTitle);

      // Create a container for sender email and timestamp
      const emailInfoContainer = document.createElement('div');
      emailInfoContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');

      // Create the sender-email element
      const senderEmail = document.createElement('p');
      senderEmail.classList.add('mb-0');
      senderEmail.innerHTML = `<strong>From: </strong> <i class="far fa-user"></i> ${email.sender}<br><strong>To: </strong> <i class="far fa-user"></i> ${email.recipients}`;
      emailInfoContainer.appendChild(senderEmail);      

      // Create a timestamp element
      const timestamp = document.createElement('p');
      timestamp.classList.add('mb-0');
      timestamp.innerHTML = `<br><i class="far fa-clock"></i> ${email.timestamp}`;
      emailInfoContainer.appendChild(timestamp);

      // Append the email-info container to the header
      emailHeader.appendChild(emailInfoContainer);

      // Append the email-header to the card container
      emailCard.appendChild(emailHeader);

      // Create the card-body for the email content
      const emailBody = document.createElement('div');
      emailBody.classList.add('card-body', 'text-center', 'bg-custom-color');

      // Create the email content
      const emailContent = document.createElement('div');
      emailContent.classList.add('card-text', 'h2', 'my-4');
      emailContent.innerHTML = email.body;

      // Append email content to email-body
      emailBody.appendChild(emailContent);

      // Append email-body to the card container
      emailCard.appendChild(emailBody);

      // Create the card-footer for buttons
      const emailFooter = document.createElement('div');
      emailFooter.classList.add('card-footer', 'd-flex', 'justify-content-between');
      emailFooter.style.padding = '17px';

      // Create a "Reply" button
      const replyButton = create_button('Reply', () => reply_to_email(email));
      replyButton.classList.add('btn', 'btn-primary', 'reply');

      // Create the archive/unarchive button only for Inbox and Archived mailboxes
      if (mailbox === 'inbox' || mailbox === 'archive') {
        const archiveButton = create_button(email.archived ? 'Unarchive' : 'Archive', () =>
          toggle_archive_email(id, email.archived, mailbox)
        );
        archiveButton.classList.add('btn', 'btn-secondary', 'archiv');
        emailFooter.appendChild(archiveButton);
      }
      if (mailbox === 'sent') {
        replyButton.style.display = 'block';
        replyButton.style.margin = '0 auto';

      }

      emailFooter.appendChild(replyButton);

      emailCard.appendChild(emailFooter);

      emailView.appendChild(emailCard);


      if (!email.read && mailbox === 'inbox') {
        mark_email_as_read(id);
      }
    })
    .catch((error) => {
      console.error('Error loading email details:', error);
    });
}

// Function to create a button element with specified text and click event handler
function create_button(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

// Function to mark an email as read
function mark_email_as_read(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ read: true }),
  })
    .then((response) => {
      if (response.ok) {
        console.log('Email marked as read.');
      } else {
        throw new Error('Failed to mark email as read');
      }
    })
    .catch((error) => {
      console.error('Error marking email as read:', error);
    });
}

// Function to toggle the archive status of an email
function toggle_archive_email(id, isArchived, mailbox) {
  const action = isArchived ? 'unarchive' : 'archive';

  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ archived: !isArchived }),
  })
    .then((response) => {
      if (response.ok) {
        showNotification(`Email ${action}d successfully.`, 'success');
        load_mailbox('inbox');
      } else {
        showNotification(`Failed to ${action} email.`, 'danger');
        throw new Error(`Failed to ${action} email`);
      }
    })
    .catch((error) => {
      console.error(`Error ${action}ing email:`, error);
    });
}

// Function to reply to an email
function reply_to_email(originalEmail) {
  // Open the compose modal
  const composeModal = new bootstrap.Modal(document.getElementById('composeModal'), {});
  composeModal.show();

  // Create a subject with "Re:" if not already present
  const subject = originalEmail.subject.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject}`;
  const body = `On ${originalEmail.timestamp} ${originalEmail.sender} wrote:\n${originalEmail.body}`;

  document.querySelector('#compose-recipients').value = originalEmail.sender;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

// Function to select a mailbox button based on the current mailbox
function selectMailboxButton(mailbox) {
  const mailboxButtons = document.querySelectorAll('.nav-link');
  mailboxButtons.forEach(button => button.classList.remove('selected'));

  if (mailbox === 'inbox') {
    document.querySelector('#inbox').classList.add('selected');
  } else if (mailbox === 'sent') {
    document.querySelector('#sent').classList.add('selected');
  } else if (mailbox === 'archive') {
    document.querySelector('#archived').classList.add('selected');
  }
}

function load_mailbox(mailbox) {
  
  const emailsView = document.querySelector('#emails-view');
  emailsView.innerHTML = '';
  selectMailboxButton(mailbox);


  fetch(`/emails/${mailbox}`)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Failed to load ${mailbox} mailbox`);
      }
    })
    .then((emails) => {

      document.querySelector('#email-view').style.display = 'none';

      emailsView.style.display = 'block';

      emails.forEach((email) => {
        const emailDiv = document.createElement('div');
        emailDiv.classList.add('email-box');

        if (!email.read) {
          emailDiv.classList.add('unread');
        } else {
          emailDiv.classList.add('read');
        }

        const timestamp = new Date(email.timestamp).toLocaleString();

        emailDiv.innerHTML = `
        <div class="email-info" style="display: flex; justify-content: space-between;">
          <div class="email-sender">${email.sender}</div>
          <div class="email-subject hide-on-small-screen">${email.subject}</div>
          <div class="email-timestamp hide-on-small-screen">${timestamp}</div>
        </div>      
        `;

        emailDiv.addEventListener('click', () => view_email(email.id, mailbox));
        emailsView.appendChild(emailDiv);
      });
    })
    .catch((error) => {
      console.error(`Error loading ${mailbox} mailbox:`, error);
    });
}

let errorTimeout;
// Function to send an email
function send_email() {
  
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  const errorDiv = document.querySelector('#error-message');


  clearTimeout(errorTimeout);

  // Input validation
  if (!recipients || !subject || !body) {

    errorDiv.textContent = 'Please fill in all fields.';
    errorDiv.style.display = 'block';

    // Hide the error message after 4 seconds
    errorTimeout = setTimeout(function () {
      errorDiv.style.display = 'none';
    }, 4000);
    
  } else {

    errorDiv.style.display = 'none';

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      }),
    })
    .then((response) => response.json())
    .then((result) => {
      if (result.error) {
        // If the result contains an error, display it in errorDiv
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';

        errorTimeout = setTimeout(function () {
          errorDiv.style.display = 'none';
        }, 4000);
      } else {
        // If no error, show a success message and perform other actions
        showNotification('Email sent successfully.', 'success');
        console.log(result);
        load_mailbox('sent');
        
        errorDiv.style.display = 'none';
        // Close the modal by simulating a click on the modal's close button
        document.querySelector('#composeModal').querySelector('.close').click();
      }
    })
    .catch((error) => {
      showNotification('Error sending email.', 'danger');
      console.error('Error sending email:', error);
    });
  }
}

function showNotification(message, type = 'success') {
  const notification = document.querySelector('#notification');
  notification.textContent = message;
  notification.className = `alert alert-${type}`;
  notification.style.display = 'none';

  // Delay the notification
  setTimeout(() => {
    notification.style.display = 'block';
  }, 800);

  setTimeout(() => {
    notification.style.display = 'none';
  }, 3300);
}
