// ---------- 3D animated background: an automation workflow canvas ----------
// Labeled step "chips" (the real apps/services a workflow connects) linked
// by curved connectors, with glowing packets traveling along them — this
// is meant to read as an actual automation graph, like the canvas inside
// n8n / Zapier / Make, rather than a generic abstract network.
(function(){
  var canvas = document.getElementById('bg-canvas');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 20;

  var group = new THREE.Group();
  scene.add(group);

  // Chip colors are baked into a canvas bitmap, so they can't just
  // follow a CSS variable — matches the page's constant dark tokens.
  var CHIP_PALETTE = { fill: 'rgba(13,13,13,0.92)', stroke: 'rgba(236,240,241,0.18)', ink: '#ECF0F1' };

  function hexToRgb(hex){
    var clean = hex.replace('#', '');
    if (clean.length === 3){
      clean = clean.split('').map(function(ch){ return ch + ch; }).join('');
    }
    var num = parseInt(clean, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function roundRectPath(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Draws a small rounded "step" chip (dot + label) to a canvas texture,
  // the same visual grammar automation-builder canvases use for nodes.
  function makeChipTexture(label, dotColor){
    var palette = CHIP_PALETTE;
    var res = 3;
    var fontSize = 26;
    var paddingX = 20;
    var height = 64;
    var dotSize = 13;

    var measure = document.createElement('canvas').getContext('2d');
    measure.font = '600 ' + fontSize + 'px "Helvetica Neue", Arial, sans-serif';
    var textWidth = measure.measureText(label).width;
    var width = Math.ceil(textWidth + paddingX * 2 + dotSize + 14);

    var c = document.createElement('canvas');
    c.width = width * res;
    c.height = height * res;
    var ctx = c.getContext('2d');
    ctx.scale(res, res);

    roundRectPath(ctx, 0.75, 0.75, width - 1.5, height - 1.5, height / 2 - 1);
    ctx.fillStyle = palette.fill;
    ctx.fill();
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    var dotX = paddingX / 1.4;
    var dotY = height / 2;

    // A soft halo behind each dot reads as a lit indicator against
    // true black.
    var rgb = hexToRgb(dotColor);
    var glowRadius = dotSize * 2.2;
    var glow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, glowRadius);
    glow.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.8)');
    glow.addColorStop(0.5, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.28)');
    glow.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(dotX, dotY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = dotColor;
    ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.ink;
    ctx.font = '600 ' + fontSize + 'px "Helvetica Neue", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, paddingX / 1.4 + dotSize + 10, height / 2 + 1);

    var texture = new THREE.CanvasTexture(c);
    texture.anisotropy = 4;
    return { texture: texture, aspect: width / height };
  }

  // A soft light-to-dark dot rather than an additive glow, reading as
  // a small solid data packet that fades into the dark background.
  function makeGlowTexture(){
    var midColor = 'rgba(189,195,199,0.85)';
    var edgeColor = 'rgba(189,195,199,0)';
    var size = 128;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, midColor);
    g.addColorStop(1, edgeColor);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  // The real steps/services a workflow like this actually connects.
  // Every chip's dot is a real (or the most iconic representative)
  // brand color — named services use their own logo color; generic
  // workflow concepts borrow the color of the tool most associated
  // with them (Postgres for "Database", Salesforce for "CRM", Postman
  // for "HTTP") so nothing falls back to a flat neutral gray.
  var steps = [
    { label: 'Webhook', color: '#06B6D4' },
    { label: 'Schedule', color: '#F59E0B' },
    { label: 'OpenAI', color: '#10A37F' },
    { label: 'GPT-4', color: '#10A37F' },
    { label: 'Slack', color: '#4A154B' },
    { label: 'Gmail', color: '#EA4335' },
    { label: 'Sheets', color: '#0F9D58' },
    { label: 'CRM', color: '#00A1E0' },
    { label: 'Filter', color: '#8B5CF6' },
    { label: 'Database', color: '#336791' },
    { label: 'Airtable', color: '#2D7FF9' },
    { label: 'HTTP', color: '#FF6C37' },
    { label: 'n8n', color: '#FF6D5A' },
    { label: 'Zapier', color: '#FF4A00' },
    { label: 'Make', color: '#6D00CC' },
    { label: 'If / Else', color: '#EC4899' },
    { label: 'HighLevel', color: '#00C2CB' }
  ];

  var isMobile = window.innerWidth < 600;
  var stepCount = isMobile ? 8 : 14;
  var shuffled = steps.slice().sort(function(){ return Math.random() - 0.5; }).slice(0, stepCount);

  // Keep a wide horizontal gap around center clear of chips: at this
  // camera distance the hero copy spans roughly world-x -7 to +7, and
  // it has no frosted backdrop (unlike the sections below) to fall
  // back on for legibility.
  var minGapX = 7.5;
  var hRange = 7;
  var vRange = 9;
  var chips = [];

  shuffled.forEach(function(step, i){
    var xSign = i % 2 === 0 ? 1 : -1;
    var pos = new THREE.Vector3(
      xSign * (minGapX + Math.random() * hRange),
      (Math.random() - 0.5) * vRange * 2,
      (Math.random() - 0.5) * 8 - 5
    );

    var chip = makeChipTexture(step.label, step.color);
    var mat = new THREE.SpriteMaterial({ map: chip.texture, transparent: true, opacity: 0.95, depthWrite: false });
    var sprite = new THREE.Sprite(mat);
    var h = 1.05;
    sprite.scale.set(h * chip.aspect, h, 1);
    sprite.position.copy(pos);
    sprite.userData.baseY = pos.y;
    sprite.userData.floatOffset = Math.random() * Math.PI * 2;
    sprite.userData.floatSpeed = 0.25 + Math.random() * 0.35;

    group.add(sprite);
    chips.push(sprite);
  });

  // Connections follow a curated set of real automation relationships
  // — trigger -> logic -> AI -> data/integration -> platform — instead
  // of pure geometric proximity, so the graph reads as an actual
  // workflow rather than whichever chips happened to land nearby.
  var relationships = [
    ['Webhook', 'Filter'],
    ['Filter', 'If / Else'],
    ['If / Else', 'OpenAI'],
    ['OpenAI', 'GPT-4'],
    ['GPT-4', 'Slack'],
    ['GPT-4', 'Gmail'],
    ['Schedule', 'HTTP'],
    ['HTTP', 'Database'],
    ['Database', 'Sheets'],
    ['Sheets', 'Airtable'],
    ['Airtable', 'CRM'],
    ['CRM', 'HighLevel'],
    ['Zapier', 'Gmail'],
    ['Zapier', 'Slack'],
    ['Make', 'Airtable'],
    ['Make', 'Sheets'],
    ['n8n', 'Webhook'],
    ['n8n', 'Database']
  ];

  var indexByLabel = {};
  shuffled.forEach(function(step, i){ indexByLabel[step.label] = i; });

  var edgeSet = {};
  var edges = [];
  var connectionCount = chips.map(function(){ return 0; });

  function addEdge(i, j){
    var key = Math.min(i, j) + '-' + Math.max(i, j);
    if (edgeSet[key]) return;
    edgeSet[key] = true;
    var arcSign = Math.random() < 0.5 ? -1 : 1;
    var arcAmount = 0.25 + Math.random() * 0.35;
    edges.push({
      a: i,
      b: j,
      curve: new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()),
      arcSign: arcSign,
      arcAmount: arcAmount,
      line: null
    });
    connectionCount[i]++;
    connectionCount[j]++;
  }

  relationships.forEach(function(pair){
    var i = indexByLabel[pair[0]];
    var j = indexByLabel[pair[1]];
    if (i !== undefined && j !== undefined){
      addEdge(i, j);
    }
  });

  // A random subset of steps won't always include both ends of every
  // curated pair above — whatever's left unconnected still gets
  // linked to its nearest chip so nothing floats in isolation.
  chips.forEach(function(sprite, i){
    if (connectionCount[i] > 0) return;
    var distances = chips.map(function(other, j){
      return { j: j, d: i === j ? Infinity : sprite.position.distanceTo(other.position) };
    });
    distances.sort(function(a, b){ return a.d - b.d; });
    if (distances.length) addEdge(i, distances[0].j);
  });

  var lineMat = new THREE.LineBasicMaterial({ color: 0xBDC3C7, transparent: true, opacity: 0.45 });
  var curveSegments = 16;
  edges.forEach(function(edge){
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((curveSegments + 1) * 3), 3));
    edge.line = new THREE.Line(geo, lineMat);
    group.add(edge.line);
  });

  function updateEdgeCurve(edge){
    var a = chips[edge.a].position;
    var b = chips[edge.b].position;
    var mid = a.clone().add(b).multiplyScalar(0.5);
    var dir = b.clone().sub(a);
    var normal = new THREE.Vector3(-dir.y, dir.x, dir.z).normalize().multiplyScalar(dir.length() * edge.arcAmount * edge.arcSign);
    var control = mid.add(normal);
    edge.curve.v0.copy(a);
    edge.curve.v1.copy(control);
    edge.curve.v2.copy(b);
    // getPointAt() (used by the traveling pulses) relies on a cached
    // arc-length table that must be invalidated after moving the curve.
    edge.curve.needsUpdate = true;

    var points = edge.curve.getPoints(curveSegments);
    var arr = edge.line.geometry.attributes.position.array;
    points.forEach(function(p, idx){
      arr[idx * 3] = p.x; arr[idx * 3 + 1] = p.y; arr[idx * 3 + 2] = p.z;
    });
    edge.line.geometry.attributes.position.needsUpdate = true;
  }
  edges.forEach(updateEdgeCurve);

  // Glowing packets traveling along the connectors, like tasks moving
  // through the automation.
  var glowTexture = makeGlowTexture();
  var pulseCount = Math.min(edges.length, isMobile ? 5 : 10);
  var pulses = [];
  for (var p = 0; p < pulseCount; p++){
    var mat = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.5, 0.5, 1);
    sprite.userData.edge = edges[p % edges.length];
    sprite.userData.t = Math.random();
    sprite.userData.speed = 0.1 + Math.random() * 0.12;
    group.add(sprite);
    pulses.push(sprite);
  }

  var mouseX = 0, mouseY = 0;
  var targetRotX = 0, targetRotY = 0;

  window.addEventListener('mousemove', function(e){
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  var scrollFactor = 0;
  window.addEventListener('scroll', function(){
    scrollFactor = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  });

  window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  var clock = new THREE.Clock();
  var isVisible = true;
  document.addEventListener('visibilitychange', function(){
    isVisible = !document.hidden;
  });

  function animate(){
    requestAnimationFrame(animate);
    if (!isVisible) return;

    var t = clock.getElapsedTime();
    var delta = Math.min(clock.getDelta(), 0.05);

    if (!prefersReducedMotion){
      chips.forEach(function(sprite){
        sprite.position.y = sprite.userData.baseY + Math.sin(t * sprite.userData.floatSpeed + sprite.userData.floatOffset) * 0.35;
      });
      edges.forEach(updateEdgeCurve);

      pulses.forEach(function(sprite){
        sprite.userData.t += delta * sprite.userData.speed;
        if (sprite.userData.t >= 1){
          sprite.userData.t = 0;
          sprite.userData.edge = edges[Math.floor(Math.random() * edges.length)];
        }
        sprite.position.copy(sprite.userData.edge.curve.getPointAt(sprite.userData.t));
      });
    }

    targetRotY += (mouseX * 0.3 - targetRotY) * 0.03;
    targetRotX += (mouseY * 0.2 - targetRotX) * 0.03;
    group.rotation.y = targetRotY;
    group.rotation.x = -targetRotX + scrollFactor * 0.4;

    renderer.render(scene, camera);
  }

  animate();
})();
