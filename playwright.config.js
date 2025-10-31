module.exports = {
    use: {
       headless: false, // Set to true if you don’t want to see the browser
       browserName: 'firefox', // Specify Firefox as the browser
       viewport: { width: 1280, height: 720 },
    },
    testDir: './tests', // Specify the test directory
};