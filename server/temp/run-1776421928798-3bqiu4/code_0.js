
function isPalindrome(x) {
  // negative numbers are not palindrome
  if (x < 0) return false;

  let original = x;
  let reversed = 0;

  while (x > 0) {
    let digit = x % 10;
    reversed = reversed * 10 + digit;
    x = Math.floor(x / 10);
  }

  return original === reversed;
}

;(function () {
  const __args   = [121];
  const __result = isPalindrome(...__args);
  process.stdout.write(JSON.stringify(__result));
})();
