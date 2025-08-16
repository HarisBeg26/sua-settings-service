const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory store for settings, aligned with frontend interfaces
let userSettings = {
  languageSettings: {
    language: 'en',
  },
  notificationSettings: {
    sms_notifications: true,
    email_notifications: false,
  },
  theme: 'light'
};

// GET endpoint to retrieve all settings
app.get('/settings', (req, res) => {
  res.json(userSettings);
});

// POST endpoint to update settings
app.post('/settings', (req, res) => {
  const { languageSettings, notificationSettings, theme } = req.body;

  if (languageSettings) {
    userSettings.languageSettings = { ...userSettings.languageSettings, ...languageSettings };
  }
  if (notificationSettings) {
    userSettings.notificationSettings = { ...userSettings.notificationSettings, ...notificationSettings };
  }
  if (theme) {
    userSettings.theme = theme;
  }

  res.json({ message: 'Settings updated successfully', settings: userSettings });
});

app.listen(port, () => {
  console.log(`Settings service listening at http://localhost:${port}`);
});
