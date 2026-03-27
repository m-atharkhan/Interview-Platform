
function twoSum(nums, target) {

  const map = new Map();

  for (let i = 0; i < nums.length; i++) {

    const complement = target - nums[i];

    if (map.has(complement)) {
      return [map.get(complement), i];
    }

    map.set(nums[i], i);

  }

  return [];

}

;(function () {
  const __args = [[3,2,4],6];
  const __src  = "function twoSum(nums, target) {\n\n  const map = new Map();\n\n  for (let i = 0; i < nums.length; i++) {\n\n    const complement = target - nums[i];\n\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n\n    map.set(nums[i], i);\n\n  }\n\n  return [];\n\n}";
  const __match = __src.match(/function\s+([a-zA-Z_$][\w$]*)/);
  if (!__match) { process.stderr.write("ERR:NO_FUNCTION"); process.exit(1); }
  const __fn = eval(__match[1]);
  if (typeof __fn !== "function") { process.stderr.write("ERR:NOT_A_FUNCTION"); process.exit(1); }
  const __result = __fn(...__args);
  process.stdout.write(JSON.stringify(__result));
})();
