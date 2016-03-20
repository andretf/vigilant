# vigilant
#### Very simple applications and servers monitor

1. Create file `config.user.json` at website root folder
2. List apps & servers in created JSON file
3. Run
  1. `app\index.html` - already with JavaScript and CSS dependencies, or
  2. `$ npm install && gulp`

Example JSON config:
```
{
  "apps": ["google.com", "localhost/myApp"],
  "servers": [ "google.com", "192.168.0.1"]
}
```

**TODO:**<br>
\+ Option "instant vs average (recent weighted pondend)"<br>
\- Remove unecessary dependencies

##Authoring
- Andre Figueiredo <andretf.inf@gmail.com>