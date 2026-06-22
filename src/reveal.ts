// Lightweight scroll-reveal: add `ref={reveal}` to any element.
let observer: IntersectionObserver | undefined;

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            observer!.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    );
  }
  return observer;
}

export function reveal(el: HTMLElement) {
  el.classList.add('reveal');
  // wait until the node is in the DOM before observing
  requestAnimationFrame(() => getObserver().observe(el));
}
