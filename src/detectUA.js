// from: https://github.com/TimvanScherpenzeel/detect-ua
class DetectUA {
  constructor() {
    this.userAgent = window.navigator.userAgent;
    this.isAndroidDevice = !/like android/i.test(this.userAgent) && /android/i.test(this.userAgent);
    this.iOSDevice = this.match(1, /(iphone|ipod|ipad)/i).toLowerCase();

    // Workaround for ipadOS, force detection as tablet
    // SEE: https://github.com/lancedikson/bowser/issues/329
    // SEE: https://stackoverflow.com/questions/58019463/how-to-detect-device-name-in-safari-on-ios-13-while-it-doesnt-show-the-correct
    if (
      navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints > 2 &&
      !window.MSStream
    ) {
      this.iOSDevice = 'ipad';
    }
  }

  match(position, pattern) {
    const match = this.userAgent.match(pattern);
    return (match && match.length > 1 && match[position]) || '';
  }

  get isMobile() {
    return (
      // Default mobile
      !this.isTablet &&
      (/[^-]mobi/i.test(this.userAgent) ||
        // iPhone / iPod
        this.iOSDevice === 'iphone' ||
        this.iOSDevice === 'ipod' ||
        // Android
        this.isAndroidDevice ||
        // Nexus mobile
        /nexus\s*[0-6]\s*/i.test(this.userAgent))
    );
  }

  get isTablet() {
    return (
      // Default tablet
      (/tablet/i.test(this.userAgent) && !/tablet pc/i.test(this.userAgent)) ||
      // iPad
      this.iOSDevice === 'ipad' ||
      // Android
      (this.isAndroidDevice && !/[^-]mobi/i.test(this.userAgent)) ||
      // Nexus tablet
      (!/nexus\s*[0-6]\s*/i.test(this.userAgent) && /nexus\s*[0-9]+/i.test(this.userAgent))
    );
  }

  get isDesktop() {
    return !this.isMobile && !this.isTablet;
  }

  get isiOS() {
    return (
      !!this.iOSDevice && {
        version:
          this.match(1, /os (\d+([_\s]\d+)*) like mac os x/i).replace(/[_\s]/g, '.') ||
          this.match(1, /version\/(\d+(\.\d+)?)/i),
      }
    );
  }

  get isAndroid() {
    return (
      this.isAndroidDevice && {
        version: this.match(1, /android[ \/-](\d+(\.\d+)*)/i),
      }
    );
  }
}

export default new DetectUA();
