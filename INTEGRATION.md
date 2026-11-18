# Homepage integration

Open the existing `index.html`.

Inside the existing `.collection-grid`, after the Original Worlds card, add:

```html
<a class="collection-card ulu-home-card" href="our-little-universe.html">
  <div class="collection-image image-surface ulu-home-cover">
    <span class="collection-number">03 / PERSONAL ARCHIVE</span>
  </div>
  <div class="collection-meta">
    <div>
      <p class="eyebrow">OUR LITTLE UNIVERSE</p>
      <h3>我们的小宇宙</h3>
      <p>关于一个声音，以及共同留下的文字与故事。</p>
    </div>
    <span class="collection-arrow">↗</span>
  </div>
</a>
```

Add this to the bottom of the existing `styles.css`:

```css
.ulu-home-card { display:block; color:inherit; text-decoration:none; }
.ulu-home-cover {
  background:
    radial-gradient(circle at 68% 35%, rgba(226,230,244,.9) 0 2%, transparent 2.5%),
    radial-gradient(circle at 68% 35%, rgba(226,230,244,.2) 0 10%, transparent 28%),
    radial-gradient(ellipse at 70% 40%, #46516c, #1a2335 55%, #101827);
  position:relative;
}
.ulu-home-cover::after {
  content:"";
  position:absolute;
  width:74px;height:74px;border-radius:50%;
  background:#e3e6ee;
  left:65%;top:28%;
  box-shadow:0 0 35px rgba(220,225,245,.35);
}
.ulu-home-cover::before {
  content:"";
  position:absolute;z-index:1;
  width:70px;height:70px;border-radius:50%;
  background:#202b40;
  left:69%;top:24%;
}
```

The third card links to a separate page. It does not modify the existing `app.js` routing or the `myself-worlds` data format.
