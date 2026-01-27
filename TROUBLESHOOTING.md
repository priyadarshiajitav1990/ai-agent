// TROUBLESHOOTING.md

# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 🔴 "GEMINI_API_KEY environment variable is required"

**Cause**: The Gemini API key is missing or not set correctly in the `.env` file.

**Solutions**:
1. Verify `.env` file exists in the project root:
   ```bash
   ls -la | grep .env
   ```

2. Check the API key is set:
   ```bash
   grep GEMINI_API_KEY .env
   ```

3. Ensure it's not empty:
   ```env
   GEMINI_API_KEY=AIzaSy... (actual key, not placeholder)
   ```

4. Get a new API key:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikeys)
   - Click "Create API Key"
   - Copy and paste into `.env`

5. Reload the application:
   ```bash
   npm start
   ```

---

### 🔴 "Cannot find module 'dotenv'"

**Cause**: Dependencies not installed.

**Solution**:
```bash
npm install
npm run build
npm start
```

---

### 🔴 Browser doesn't open automatically

**Cause**: 
- System doesn't support the `open` package
- Browser integration not available
- Environment restrictions

**Solution**:
1. You'll see the OAuth URL in the terminal:
   ```
   📱 Please visit this URL in your browser:
   https://accounts.google.com/o/oauth2/v2/auth?...
   ```

2. Copy and paste the URL into your browser manually

3. After authorization, copy the code from the browser

4. Paste it when prompted: "Enter the authorization code from the browser:"

---

### 🔴 "No projects available"

**Cause**: 
- No GCP projects created
- OAuth credentials don't have permission
- Cloud Resource Manager API not enabled

**Solutions**:

1. **Create a GCP Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Click "Select a Project" → "New Project"
   - Enter project name
   - Click "Create"

2. **Enable Cloud Resource Manager API**:
   - In Cloud Console, search for "Cloud Resource Manager API"
   - Click on it
   - Click "Enable"

3. **Fix OAuth Permissions**:
   - Go to [Cloud Console](https://console.cloud.google.com)
   - APIs & Services → OAuth consent screen
   - Ensure you're set as a tester
   - Add your email to test users if needed

4. **Re-authenticate**:
   - Delete credentials file: `rm ~/.ai-agent/credentials.json`
   - Restart the application
   - Go through authentication again

---

### 🔴 "Failed to get projects" Error

**Cause**: 
- OAuth token is invalid or expired
- Network connectivity issue
- API service error

**Solutions**:

1. **Clear credentials and re-authenticate**:
   ```bash
   rm ~/.ai-agent/credentials.json
   npm start
   ```

2. **Check network connection**:
   ```bash
   ping google.com
   ```

3. **Check API status**:
   - Visit [Google Cloud Status Dashboard](https://status.cloud.google.com)

4. **Verify OAuth credentials in .env**:
   ```bash
   grep GOOGLE_OAUTH .env
   ```

---

### 🔴 "Credentials expired"

**Cause**: OAuth token has expired (usually after 1 hour of inactivity).

**Solution**:
1. Delete expired credentials:
   ```bash
   rm ~/.ai-agent/credentials.json
   ```

2. Restart the application:
   ```bash
   npm start
   ```

3. Go through authentication again

---

### 🔴 "No models available"

**Cause**: 
- API not responding
- Project not accessible
- Service not enabled

**Solution**:

1. Ensure you have the correct project selected

2. Enable the AI Platform API:
   - Cloud Console → APIs & Services
   - Search for "Vertex AI API"
   - Click "Enable"

3. Restart the application

---

### 🔴 Gemini API returns "Invalid API Key"

**Cause**:
- API key is incorrect
- API key is expired
- API key doesn't have required permissions

**Solution**:

1. Verify the key is correct:
   ```bash
   grep GEMINI_API_KEY .env | cut -d= -f2
   ```

2. Test the key in [Google AI Studio](https://aistudio.google.com/app/apikeys)

3. Generate a new key if needed

4. Update `.env` and restart

---

### 🔴 Chat returns no response or timeout

**Cause**:
- Network issue
- API overloaded
- Invalid request format
- Model not available

**Solution**:

1. Try again (may be temporary):
   ```
   You: Your message
   (wait a moment)
   ```

2. Check API status:
   - [Google Cloud Status](https://status.cloud.google.com)
   - [Google AI Status](https://status.cloud.google.com/service/generativeai)

3. Verify model is still available:
   ```
   /info
   ```

4. Try a simpler query first:
   ```
   You: Hello
   ```

5. Check network:
   ```bash
   ping google.com
   ```

---

### 🔴 "Cannot read properties of undefined"

**Cause**: Object reference error, usually in initialization.

**Solution**:

1. Check all environment variables are set:
   ```bash
   cat .env | grep -v '^#' | grep -v '^$'
   ```

2. Rebuild the project:
   ```bash
   npm run build
   ```

3. Clear and reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   npm run build
   npm start
   ```

---

### 🔴 Permission denied on ~/.ai-agent/ files

**Cause**: File permissions issue, usually after system update.

**Solution**:

1. Fix directory permissions:
   ```bash
   chmod 700 ~/.ai-agent
   chmod 600 ~/.ai-agent/credentials.json 2>/dev/null || true
   ```

2. Or, reset everything:
   ```bash
   rm -rf ~/.ai-agent
   npm start
   ```

---

### 🔴 "Cannot find module '@google/generative-ai'"

**Cause**: Package not installed or installation failed.

**Solution**:

1. Reinstall packages:
   ```bash
   npm install
   ```

2. If it still fails, clear cache and reinstall:
   ```bash
   npm cache clean --force
   npm install
   ```

3. Check package-lock.json:
   ```bash
   rm -f package-lock.json
   npm install
   ```

---

### 🔴 Chat works but response is cut off

**Cause**: 
- Large response not fully displayed
- Terminal width too narrow
- Streaming issue

**Solution**:

1. Widen terminal window

2. Try a different terminal

3. Try a more specific question to get shorter responses

---

### 🔴 Application crashes on startup

**Cause**:
- Corrupted credentials file
- Invalid configuration
- Dependency issue

**Solution**:

1. Check logs for errors:
   ```bash
   npm start 2>&1 | head -20
   ```

2. Reset credentials:
   ```bash
   rm ~/.ai-agent/credentials.json
   ```

3. Rebuild:
   ```bash
   rm -rf dist
   npm run build
   npm start
   ```

4. If still failing, start fresh:
   ```bash
   rm -rf node_modules dist ~/.ai-agent
   npm install
   npm run build
   npm start
   ```

---

### 🔴 Commands like /menu not working

**Cause**: Commands not recognized, check exact spelling.

**Solution**:

1. Verify command syntax:
   - `/menu` ✅
   - `/clear` ✅
   - `/info` ✅
   - `/exit` ✅

2. Commands are case-sensitive: `/Menu` ❌

3. No spaces in command: `/ menu` ❌

4. Type exactly as shown (with forward slash)

---

### 🔴 Session file not created

**Cause**: Directory permissions or permissions issue.

**Solution**:

1. Ensure directory exists and is writable:
   ```bash
   mkdir -p ~/.ai-agent/sessions
   chmod 700 ~/.ai-agent
   ```

2. Check write permissions:
   ```bash
   touch ~/.ai-agent/sessions/test.txt
   rm ~/.ai-agent/sessions/test.txt
   ```

---

### 🔴 OAuth window opens but shows error

**Cause**:
- Invalid redirect URI
- OAuth credentials not set up correctly
- Browser security issue

**Solution**:

1. Verify OAuth credentials are correct:
   ```bash
   grep GOOGLE_OAUTH .env
   ```

2. Check redirect URI matches Google Console:
   - [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services → Credentials
   - Edit OAuth client
   - Verify redirect URIs include: `http://localhost:3000/auth/callback`

3. Try in a different browser

4. Clear browser cookies and try again

---

### 🔴 "read ECONNRESET" or network errors

**Cause**: Network connectivity issue.

**Solution**:

1. Check internet connection:
   ```bash
   ping google.com
   ```

2. Check if behind a firewall/proxy:
   - May need to configure npm proxy
   ```bash
   npm config set https-proxy [proxy-url]
   ```

3. Try again later if it's a temporary connectivity issue

4. Check firewall settings allow access to googleapis.com

---

### 🔴 Model selection dropdown shows no options

**Cause**: API not returning models, or parsing error.

**Solution**:

1. Verify project is accessible:
   ```
   /info
   ```

2. Check model list API:
   - May need additional permissions

3. Try selecting default project first

4. Restart application

---

## Debug Mode

To get more detailed logs:

```bash
# Set log level to debug
LOG_LEVEL=debug npm start
```

This will show:
- Detailed API calls
- Auth flow steps
- Session creation
- Model fetching
- API responses

---

## Checking System Status

```bash
# Check Node.js version
node --version  # Should be 18+

# Check npm version
npm --version

# Check if .env exists
cat .env

# Check credentials file
ls -la ~/.ai-agent/

# Test network
ping google.com

# Check API keys are loaded
echo $GEMINI_API_KEY
```

---

## Getting Help

If issues persist:

1. **Check documentation**:
   - [README.md](README.md)
   - [SETUP_GUIDE.md](SETUP_GUIDE.md)
   - [ARCHITECTURE.md](ARCHITECTURE.md)

2. **Review error message** carefully - it usually tells you the problem

3. **Try fresh install**:
   ```bash
   rm -rf ~/.ai-agent node_modules dist
   npm install
   npm run build
   npm start
   ```

4. **Check logs** with debug mode:
   ```bash
   LOG_LEVEL=debug npm start 2>&1 | tee debug.log
   ```

5. **Verify all prerequisites** are met (Node 18+, npm installed, etc.)

---

## Common Success Indicators

✅ You know it's working when you see:

1. First login:
   ```
   🔐 Authentication Required
   Opening browser for authentication...
   ```

2. Browser opens automatically

3. Project selection dropdown appears

4. Model selection dropdown appears

5. Chat prompt shows:
   ```
   You: [ready to type]
   ```

6. Chat responds:
   ```
   Assistant: [response from Gemini]
   ```

---

## Still Stuck?

Try the **Nuclear Option** (resets everything):

```bash
# Remove all generated files and credentials
rm -rf ~/.ai-agent
rm -rf node_modules
rm -rf dist
rm package-lock.json

# Fresh install
npm install

# Rebuild
npm run build

# Start fresh
npm start
```

Good luck! 🚀
