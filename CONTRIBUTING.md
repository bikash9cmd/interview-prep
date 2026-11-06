# Contributing

Thanks for helping make this study guide better. Fixes to wrong answers, clearer explanations and new interview questions are all welcome.

## How to contribute

1. Fork the repo and create a branch: `git checkout -b fix/docker-volume-answer`.
2. Make your change. Content lives in the data files:
   - `data-linux-*.js`, `data-git-*.js`, `data-docker-*.js` for concepts, commands, questions and labs
   - `data-plan.js` for the study plan
3. Open `index.html` in a browser and check your change renders and the search still finds it.
4. Commit with a clear message (Conventional Commits are preferred, for example `fix(docker): correct volume vs bind mount answer`) and open a pull request.

## Writing questions

- Keep each question to one idea, and say which level it is: basic, intermediate or scenario.
- Model answers should be short enough to say out loud in under a minute.
- Wrap commands in `«` and `»` so they render as code, for example `«chmod 754 script.sh»`.
- Commands should work on a current Ubuntu or Debian system.

## Reporting problems

Open an issue with the track, the question or section, and what is wrong. A suggested fix helps a lot.
