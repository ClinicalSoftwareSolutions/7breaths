7breaths
========

Calculate the respiratory rate of a patient easily and accurately

The initial idea was from Wai Keong on the NHS HackDay mailing list. Details of which are also on his blog http://wai2k.wordpress.com/2013/06/16/a-simple-app-for-counting-respiratory-rate/

7Breaths is an application to make measuring the respiratory rate clinically (i.e. by a person watching) easy.

The name "7Breaths" was suggested by Barry Rowlingson

The initial mailing list discussion can be found on the Google groups pages https://groups.google.com/forum/?hl=en&fromgroups#!topic/nhshackday/ioOECJ3ZVEI

## Building

The application has been built using the [Appcelerator Framework](http://www.appcelerator.com/developers/) and the Alloy compoment. Installation instructions and how to build appcelerator source is all on their website.

A [Stackmob account](https://www.stackmob.com/) is also required and is free to sign up to. Create a new app on Stackmob and then create a new Schema called rr. Edit the app/assets/stackmob.cfg file with the API key and then rename it to a .js extension.

The rr schema needs to have the following fields:

|===|===|
|data| array[integer] |
|device|	string |
|fixed_or_timed| string |
|fixed_or_timed_value| float |

## Discussion

Please use the [Wiki](https://github.com/ClinicalSoftwareSolutions/7breaths/wiki) to contribute to [development ideas](https://github.com/ClinicalSoftwareSolutions/7breaths/wiki/Initial-ideas-for-app) and to see things like the roadmap

## Contributors

+ Wai Keong
+ Neville Dastur
+ Barry Rowlingson

## License

The source is released under the GNU AFFERO GENERAL PUBLIC LICENSE so please fork, contribute and learn. The only thing you are not allowed to do with the source is compile and release into any App Store, either as a commercial product or free.

Detail of the license can be found in the [LICENSE file](https://github.com/ClinicalSoftwareSolutions/7breaths/blob/master/LICENSE)
