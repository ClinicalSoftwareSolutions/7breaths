7breaths
========

Calculate the respiratory rate of a patient easily and accurately 

The initial idea was from Wai Keong on the NHS HackDay mailing list. To quote:

>The respiratory rate (how many times you breathe in one minute) is a very sensitive indicator on whether a patient is well or unwell. It is a vital part in all early warning scores. Indeed, it is often the first parameter that becomes abnormal.
>
>Unfortunately, this is also a parameter is measured inaccurately and often omitted by healthcare professionals.
>
>Reasons (and excuses) include:-
>
>* Most bedside observation machines do not produce a number that people can write down unlike the Heart Rate, Blood Pressure, Oxygen Saturations
>* Requires the clinicians (often healthcare assistants) to count how many breaths a patient takes per minute. Over 30 patients, this observation along can take 30mins. (people get lazy). The one minute is recommended is because unlike our pulse our respiratory rate can be quire irregular. (unless you are breathing very fast then it becomes more regular.)
>* You need a watch with a secondhand/ stopwatch
>
>As more and more hospitals progress towards digital collection of observations on smartphones, 
>
>I'm proposing a simple application that counts respiratory rates that is accurate and that will require minimal 'skill' and training.
>
>This is how it works:-
>
>1. Start the app
>2. It will have a BIG button in the middle of it that just says 'Press here every time the patient breaths'
>3. The program will *figure* out how regular the patient is breathing to determine the length of time the observer needs to count. For eg. if the patient is taking 5 secs btw breaths and is very regular, 30 secs may be enough. But if it is 10secs, 1 min or more is required. Conversely if something is breathing every 2 secs, 15 secs of observation is more than enough. The accuracy of this algorithm can be refined in a field study.
>4. The app, gives you a respiratory rate
>5. THAT's it
