import os
import re
from html.parser import HTMLParser

# Helper parser to extract tag details for validation
class StaticHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.h1_count = 0
        self.canvas_attrs = {}
        self.inputs = []
        self.labels = []
        self.live_regions = []
        self.nav_tabs = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        self.tags.append((tag, attr_dict))
        
        if tag == 'h1':
            self.h1_count += 1
        elif tag == 'canvas':
            if attr_dict.get('id') == 'game-canvas':
                self.canvas_attrs = attr_dict
        elif tag == 'input':
            self.inputs.append(attr_dict)
        elif tag == 'label':
            self.labels.append(attr_dict)
        elif attr_dict.get('aria-live'):
            self.live_regions.append(attr_dict)
        elif attr_dict.get('role') == 'tab' or attr_dict.get('role') == 'tablist':
            self.nav_tabs.append((tag, attr_dict))

def test_index_html_existence():
    """Verify index.html exists at the project root."""
    assert os.path.exists("index.html"), "index.html must be located at the root of the workspace"

def test_static_assets_integrity():
    """Verify index.html links to correct, existing relative static asset paths."""
    assert os.path.exists("index.html")
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    # Search for relative asset links (supporting cache-busting queries)
    css_match = re.search(r'href="static/css/style.css(?:\?v=\d+\.\d+)?"', html)
    game_js_match = re.search(r'src="static/js/game.js(?:\?v=\d+\.\d+)?"', html)
    app_js_match = re.search(r'src="static/js/app.js(?:\?v=\d+\.\d+)?"', html)

    assert css_match, "index.html must link to relative static/css/style.css"
    assert game_js_match, "index.html must link to relative static/js/game.js"
    assert app_js_match, "index.html must link to relative static/js/app.js"

    # Confirm files exist on disk
    assert os.path.exists("static/css/style.css"), "static/css/style.css file is missing"
    assert os.path.exists("static/js/game.js"), "static/js/game.js file is missing"
    assert os.path.exists("static/js/app.js"), "static/js/app.js file is missing"

def test_accessibility_compliance():
    """Verify accessibility markers in index.html (ARIA roles, labels, tab indices)."""
    assert os.path.exists("index.html")
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    parser = StaticHTMLParser()
    parser.feed(html)

    # 1. Single H1 heading
    assert parser.h1_count == 1, "There should be exactly one h1 tag on the page for SEO & screen readers"

    # 2. Canvas accessibility
    assert "id" in parser.canvas_attrs, "Canvas element must have an id tag"
    assert parser.canvas_attrs.get("tabindex") == "0", "Canvas must be focusable by keyboard tab sequence (tabindex=0)"
    assert "aria-label" in parser.canvas_attrs, "Canvas must have a descriptive aria-label"

    # 3. Live announcer for notifications
    assert len(parser.live_regions) >= 1, "Must contain at least one element with aria-live for screen announcements"

    # 4. Form inputs must map to labels
    input_ids = [inp.get("id") for inp in parser.inputs if inp.get("id")]
    label_fors = [lbl.get("for") for lbl in parser.labels if lbl.get("for")]

    for input_id in input_ids:
        assert input_id in label_fors, f"Form input with id '{input_id}' is missing a corresponding label with matching 'for' attribute"

    # 5. WAI-ARIA tabs navigation
    role_tablists = [r for t, r in parser.nav_tabs if r.get("role") == "tablist"]
    role_tabs = [r for t, r in parser.nav_tabs if r.get("role") == "tab"]

    assert len(role_tablists) >= 1, "Sidebar navigation must have a tablist container role"
    assert len(role_tabs) >= 5, "Sidebar navigation tabs must have role='tab'"

def test_css_progressive_themes():
    """Verify that CSS contains the 5 stages of the progressive green level-up theme."""
    css_path = "static/css/style.css"
    assert os.path.exists(css_path)
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()

    assert ".theme-polluted" in css, "style.css is missing .theme-polluted styling rule"
    assert ".theme-recovering" in css, "style.css is missing .theme-recovering styling rule"
    assert ".theme-river" in css, "style.css is missing .theme-river styling rule"
    assert ".theme-mountain" in css, "style.css is missing .theme-mountain styling rule"
    assert ".theme-future" in css, "style.css is missing .theme-future styling rule"

def test_js_local_data_controller():
    """Verify JS utilizes localStorage for data caching and contains the high-level preview account."""
    js_path = "static/js/app.js"
    assert os.path.exists(js_path)
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    assert "localStorage" in js, "app.js must utilize client-side localStorage to persist data"
    assert "test_guardian" in js, "app.js must contain preconfigured user 'test_guardian' credentials"
    assert "password123" in js, "app.js must contain 'password123' password check for test guardian"
