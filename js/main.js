/* =========================================================
   无声 · 互鉴 — 交互脚本（原生 JS，无依赖）
   1. 移动端导航   2. 滚动入场   3. 时间线逐级高亮
   4. 标签页       5. 回到顶部   6. 图表（ECharts，可降级）
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 移动端导航 ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    // 点击链接或按 Esc 关闭
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- 2. 滚动入场 ---------- */
  var revealItems = document.querySelectorAll('.reveal');

  if (revealItems.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = Number(el.dataset.delay || 0);
          window.setTimeout(function () { el.classList.add('is-in'); }, delay);
          revealObserver.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

      revealItems.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ---------- 3. 时间线：随滚动逐级高亮 ---------- */
  var steps = document.querySelectorAll('.timeline .step');

  if (steps.length) {
    if (!('IntersectionObserver' in window)) {
      steps.forEach(function (s) { s.classList.add('is-active'); });
    } else {
      var stepObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-active', entry.isIntersecting);
        });
      }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });

      steps.forEach(function (s) { stepObserver.observe(s); });

      // 点击节点也可切换焦点
      steps.forEach(function (s) {
        s.addEventListener('click', function () {
          steps.forEach(function (o) { o.classList.remove('is-active'); });
          s.classList.add('is-active');
          s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
        });
      });
    }
  }

  /* ---------- 4. 标签页（每个 [data-tabs] 独立） ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var buttons = Array.prototype.slice.call(root.querySelectorAll('.tabs__nav button'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('.tab-panel'));
    if (!buttons.length || !panels.length) return;

    function activate(index) {
      buttons.forEach(function (btn, i) {
        var selected = i === index;
        btn.setAttribute('aria-selected', String(selected));
        btn.setAttribute('tabindex', selected ? '0' : '-1');
      });
      panels.forEach(function (panel, i) {
        panel.hidden = i !== index;
      });
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () { activate(i); });
      btn.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = (i + dir + buttons.length) % buttons.length;
        buttons[next].focus();
        activate(next);
      });
    });

    activate(0);
  });

  /* ---------- 5. 回到顶部 ---------- */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    var onScroll = function () {
      toTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 6. 页脚年份 ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- 7. 图表：南非 SLPA 毕业生族裔构成（ECharts，失败则保留表格） ---------- */
  var chartEl = document.getElementById('slpa-chart');
  var chartFallback = document.querySelector('.chart-fallback');

  if (chartEl && typeof window.echarts !== 'undefined') {
    // 容器默认隐藏，确认图表库可用后再显示并初始化（避免 0×0 尺寸）
    chartEl.style.display = 'block';
    var chart = window.echarts.init(chartEl, null, { renderer: 'svg' });
    if (chartFallback) chartFallback.hidden = true;

    chart.setOption({
      color: ['#1F3A5F', '#E8833A'],
      grid: { left: 8, right: 24, top: 48, bottom: 8, containLabel: true },
      legend: {
        top: 0,
        left: 0,
        itemWidth: 10,
        itemHeight: 10,
        icon: 'roundRect',
        textStyle: { color: '#4a5361', fontSize: 12.5 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#14273f',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 12.5 },
        valueFormatter: function (v) { return v + '%'; }
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%', color: '#8b95a3', fontSize: 12 },
        splitLine: { lineStyle: { color: 'rgba(31,58,95,0.08)' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'category',
        data: ['全国人口构成', 'SLPA 毕业生构成'],
        axisLabel: { color: '#2b3038', fontSize: 13 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [
        {
          name: '黑人非洲裔',
          type: 'bar',
          data: [81.4, 23.1],
          barWidth: 26,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#1F3A5F',
            fontWeight: 600,
            fontSize: 12.5
          }
        },
        {
          name: '其他族裔',
          type: 'bar',
          data: [18.6, 76.9],
          barWidth: 26,
          itemStyle: { borderRadius: [0, 4, 4, 0], opacity: 0.75 },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#a06a3f',
            fontSize: 12.5
          }
        }
      ]
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { chart.resize(); }, 160);
    });
  }
})();
