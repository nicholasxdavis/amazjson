# Amazjson

Chrome extension that extracts Amazon shopping cart items into JSON format.

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to your Amazon cart page
2. Click the extension icon
3. Click "Extract Cart Data"
4. Copy the JSON output or download it as a file

## Output Format

```json
[
  {
    "title": "Product Name",
    "url": "https://amazon.com/product-path",
    "price": "$29.99"
  }
]
```

## Permissions

- `activeTab`: Access to the current Amazon tab
- `scripting`: Inject script to extract cart data
- `https://*.amazon.com/*`: Access to Amazon.com pages


This extension is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates.
