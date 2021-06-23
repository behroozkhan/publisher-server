module.exports = {
    apps : [{
        name      : 'Publisher Worker',
        script    : 'index.js',
        node_args : '-r dotenv/config',
    }],
}