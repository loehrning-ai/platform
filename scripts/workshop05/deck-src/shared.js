// Back button: fades after 2.5 s without mouse movement (the deck hides its own chrome the same way), returns on mouse move or focus.
const back = document.querySelector('.deck-back');
if (back) {
  let idle = 0;
  const wake = () => { back.classList.remove('is-idle'); clearTimeout(idle); idle = setTimeout(() => back.classList.add('is-idle'), 2500); };
  window.addEventListener('mousemove', wake, { passive: true });
  back.addEventListener('focus', wake);
  wake();
}
