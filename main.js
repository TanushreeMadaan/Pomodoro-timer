const timer = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  sessions: 0,
};

let interval;
let dailyGoal = 0;
let sessionsCompleted = 0;

const buttonSound = new Audio('button-sound.mp3');
const mainButton = document.getElementById('js-btn');
mainButton.addEventListener('click', () => {
  buttonSound.play();
  const { action } = mainButton.dataset;
  if (action === 'start') {
    startTimer();
  } else {
    stopTimer();
  }
});

const modeButtons = document.querySelector('#js-mode-buttons');
modeButtons.addEventListener('click', handleMode);

function getRemainingTime(endTime) {
  const currentTime = Date.parse(new Date());
  const difference = endTime - currentTime;

  const total = Number.parseInt(difference / 1000, 10);
  const minutes = Number.parseInt((total / 60) % 60, 10);
  const seconds = Number.parseInt(total % 60, 10);

  return {
    total,
    minutes,
    seconds,
  };
}

function startTimer() {
  let { total } = timer.remainingTime;
  const endTime = Date.parse(new Date()) + total * 1000;

  if (timer.mode === 'pomodoro') timer.sessions++;

  mainButton.dataset.action = 'stop';
  mainButton.textContent = 'stop';
  mainButton.classList.add('active');

  interval = setInterval(function () {
    timer.remainingTime = getRemainingTime(endTime);
    updateClock();

    total = timer.remainingTime.total;
    if (total <= 0) {
      clearInterval(interval);

      switch (timer.mode) {
        case 'pomodoro':
          if (timer.sessions % timer.longBreakInterval === 0) {
            switchMode('longBreak');
          } else {
            switchMode('shortBreak');
          }
          break;
        default:
          switchMode('pomodoro');
      }

      if (Notification.permission === 'granted') {
        const text =
          timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
        new Notification(text);
      }

      document.querySelector(`[data-sound="${timer.mode}"]`).play();

      addSessionHistory(timer.mode, timer[timer.mode]);

      startTimer();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);

  mainButton.dataset.action = 'start';
  mainButton.textContent = 'start';
  mainButton.classList.remove('active');
}

function updateClock() {
  const { remainingTime } = timer;
  const minutes = `${remainingTime.minutes}`.padStart(2, '0');
  const seconds = `${remainingTime.seconds}`.padStart(2, '0');

  const min = document.getElementById('js-minutes');
  const sec = document.getElementById('js-seconds');
  min.textContent = minutes;
  sec.textContent = seconds;

  const text =
    timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
  document.title = `${minutes}:${seconds} — ${text}`;

  const progress = document.getElementById('js-progress');
  progress.value = timer[timer.mode] * 60 - timer.remainingTime.total;
}

function switchMode(mode) {
  timer.mode = mode;
  timer.remainingTime = {
    total: timer[mode] * 60,
    minutes: timer[mode],
    seconds: 0,
  };

  document
    .querySelectorAll('button[data-mode]')
    .forEach((e) => e.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  document.body.style.backgroundColor = `var(--${mode})`;
  document
    .getElementById('js-progress')
    .setAttribute('max', timer.remainingTime.total);

  updateClock();
}

function handleMode(event) {
  const { mode } = event.target.dataset;

  if (!mode) return;

  switchMode(mode);
  stopTimer();
}

function setDailyGoal() {
  dailyGoal = parseInt(document.getElementById('goal-input').value, 10);
  sessionsCompleted = 0;
  updateGoalDisplay();
}

function updateGoalDisplay() {
  const goalDisplay = document.getElementById('goal-display');
  goalDisplay.textContent = `Goal: ${sessionsCompleted}/${dailyGoal} sessions completed`;
}

function addSessionHistory(sessionType, duration) {
  const historyList = document.getElementById('history-list');
  const listItem = document.createElement('li');
  const now = new Date();
  const timeString = now.toLocaleTimeString();

  listItem.textContent = `${sessionType} session (${duration} minutes) at ${timeString}`;
  historyList.appendChild(listItem);

  if (sessionType === 'pomodoro') {
    sessionsCompleted += 1;
    updateGoalDisplay();

    const noHistoryMessage = document.getElementById('no-history-message');
    if (noHistoryMessage) {
      historyList.removeChild(noHistoryMessage);
    }
  }

  // Ensure the newly added item is visible without changing the zoom level
  historyList.scrollTop = historyList.scrollHeight;
}

function updateSessionHistory() {
  const historyList = document.getElementById('history-list');

  if (historyList.childElementCount === 0) {
    const noHistoryMessage = document.createElement('p');
    noHistoryMessage.textContent = 'No session history';
    noHistoryMessage.id = 'no-history-message';
    historyList.appendChild(noHistoryMessage);
  } else {
    const noHistoryMessage = document.getElementById('no-history-message');
    if (noHistoryMessage) {
      historyList.removeChild(noHistoryMessage);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateSessionHistory();
  if ('Notification' in window) {
    if (
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          new Notification(
            'Awesome! You will be notified at the start of each session'
          );
        }
      });
    }
  }

  switchMode('pomodoro');
  updateGoalDisplay();
});
