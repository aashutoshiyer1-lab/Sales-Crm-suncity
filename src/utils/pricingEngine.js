import { VENUES, isWeekend, OFFERS } from '../config/venueData.js';

export const calculatePricing = ({ venue, gameName, paxCount, date, offerId = 'none', isWeekendOverride = null }) => {
  const pax = Math.max(0, parseInt(paxCount, 10) || 0);
  const weekend = isWeekendOverride !== null && isWeekendOverride !== undefined 
    ? Boolean(isWeekendOverride) 
    : isWeekend(date);

  let ratePerPax = 0;
  let tierLabel = '';

  if (pax > 0 && gameName && gameName !== '') {
    if (venue === VENUES.ESCAPE_TIME) {
      // 60-Minute Mystery Games: Locked Inn, Bank Heist
      if (
        gameName === 'Locked Inn' || 
        gameName === 'Locked In' || 
        gameName === 'Bank Heist' ||
        gameName === "Professor X's Lab" ||
        gameName === "Sherlock's Last Case"
      ) {
        if (pax <= 3) {
          ratePerPax = weekend ? 849 : 749;
          tierLabel = '2-3 Players Category';
        } else if (pax <= 6) {
          ratePerPax = weekend ? 799 : 699;
          tierLabel = '4-6 Players Category';
        } else {
          ratePerPax = weekend ? 749 : 649;
          tierLabel = '7+ Players Category';
        }
      } 
      // 30-Minute Mystery Games: Phonebooth, Haunted Elevator, World War Bunker
      else if (
        gameName === 'Phonebooth' || 
        gameName === 'Haunted Elevator' || 
        gameName === 'World War Bunker' ||
        gameName === 'Spy Agents'
      ) {
        if (pax <= 3) {
          ratePerPax = weekend ? 499 : 449;
          tierLabel = '2-3 Players Category';
        } else if (pax <= 6) {
          ratePerPax = weekend ? 449 : 399;
          tierLabel = '4-6 Players Category';
        } else {
          ratePerPax = weekend ? 399 : 349;
          tierLabel = '7+ Players Category';
        }
      }
    } else if (venue === VENUES.LASER_SHOOTER) {
      tierLabel = 'Flat Rate Arena';
      const gLower = gameName.toLowerCase();
      // 10 Mins Game
      if (gameName === '10 Mins Game' || gameName === 'Combat' || gLower.includes('10 min')) {
        ratePerPax = weekend ? 279 : 219;
      } 
      // 20 Mins Game
      else if (gameName === '20 Mins Game' || gameName === 'Battle' || gLower.includes('20 min')) {
        ratePerPax = weekend ? 389 : 349;
      } 
      // 30 Mins Game
      else if (gameName === '30 Mins Game' || gameName === 'War' || gLower.includes('30 min')) {
        ratePerPax = weekend ? 549 : 449;
      }
    }
  }

  const baseTotal = ratePerPax * pax;

  const selectedOffer = OFFERS.find(o => o.id === offerId) || OFFERS[0];
  const discountPercentage = selectedOffer.percentage || 0;
  
  // 100% OFF for Complimentary Game (Kids Under 6 Years)
  const discountAmount = Math.round((baseTotal * discountPercentage) / 100);
  const finalTotalAmount = Math.max(0, baseTotal - discountAmount);

  return {
    ratePerPax,
    pax,
    baseTotal,
    discountPercentage,
    discountAmount,
    totalAmount: finalTotalAmount,
    tierLabel: tierLabel || 'Select Game & Players',
    isWeekend: weekend,
    dayType: weekend ? 'Weekend Rate' : 'Weekday Rate',
    offerName: selectedOffer.name,
    offerId: selectedOffer.id,
  };
};

export const getGameCategoryLabel = (booking) => {
  if (!booking) return '';
  if (booking.venue === VENUES.LASER_SHOOTER) {
    return 'Flat Rate Arena';
  }
  const pax = Number(booking.paxCount) || 0;
  if (pax <= 3) return '2-3 Players Category';
  if (pax <= 6) return '4-6 Players Category';
  return '7+ Players Category';
};

