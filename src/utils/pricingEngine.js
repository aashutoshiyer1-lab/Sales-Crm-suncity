import { VENUES, isWeekend, OFFERS } from '../config/venueData.js';

export const calculatePricing = ({ venue, gameName, paxCount, date, offerId = 'none', isWeekendOverride = null }) => {
  const pax = Math.max(0, parseInt(paxCount, 10) || 0);
  const weekend = isWeekendOverride !== null && isWeekendOverride !== undefined 
    ? Boolean(isWeekendOverride) 
    : isWeekend(date);

  let ratePerPax = 0;
  let tierLabel = '';

  if (pax > 0 && gameName && gameName !== '') {
    if (venue === VENUES.ESCAPE_TIME || venue === 'Escape Time') {
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
        gameName === 'Phone booth' ||
        gameName === 'Haunted Elevator' || 
        gameName === 'World War Bunker' ||
        gameName === 'Bunker' ||
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
    } else if (venue === VENUES.LASER_SHOOTER || venue === 'Laser Shooter') {
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
  const isComplimentary = offerId === 'complimentary';
  const discountPercentage = isComplimentary ? 100 : (selectedOffer.percentage || 0);
  
  // 100% OFF for Complimentary Game (Kids Under 5 Years)
  const discountAmount = isComplimentary ? baseTotal : Math.round((baseTotal * discountPercentage) / 100);
  const finalTotalAmount = isComplimentary ? 0 : Math.max(0, baseTotal - discountAmount);

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

export const getBookingCategory = (booking, allBookings = []) => {
  if (!booking) return '2-3';
  if (booking.venue !== 'Escape Time' && booking.venue !== VENUES.ESCAPE_TIME) return 'laser';

  // 1. Explicit Category Override from modal confirmation
  if (booking.categoryOverride) {
    if (booking.categoryOverride.includes('2-3')) return '2-3';
    if (booking.categoryOverride.includes('4-6')) return '4-6';
    if (booking.categoryOverride.includes('7+')) return '7+';
    return booking.categoryOverride;
  }

  // 2. Sibling Group Inheritance (Inherit bracket from paying group in same room/time)
  const isComplimentary = booking.offerId === 'complimentary' || Number(booking.totalAmount) === 0;
  if (isComplimentary && Array.isArray(allBookings) && allBookings.length > 0) {
    const sibling = allBookings.find(b => 
      b.id !== booking.id &&
      b.status !== 'Cancelled' &&
      b.date === booking.date &&
      (b.venue === 'Escape Time' || b.venue === VENUES.ESCAPE_TIME) &&
      Number(b.totalAmount) > 0 &&
      (
        (b.timeSlot && booking.timeSlot && b.timeSlot === booking.timeSlot && b.gameName === booking.gameName) ||
        (b.phone && booking.phone && b.phone === booking.phone && b.phone.length > 5) ||
        (b.customerName && booking.customerName && b.customerName.trim().toLowerCase() === booking.customerName.trim().toLowerCase())
      )
    );
    if (sibling) return getBookingCategory(sibling, []);
  }

  // 3. Fallback: Default complimentary to '4-6' instead of '2-3'
  const pax = Number(booking.paxCount) || 0;
  if (pax >= 7) return '7+';
  if (pax >= 4) return '4-6';
  if (isComplimentary) return '4-6';
  return '2-3';
};

export const getGameCategoryLabel = (booking, allBookings = []) => {
  if (!booking) return '';
  if (booking.venue === VENUES.LASER_SHOOTER || booking.venue === 'Laser Shooter') {
    return 'Flat Rate Arena';
  }
  const cat = getBookingCategory(booking, allBookings);
  if (cat === '2-3') return '2-3 Players Category';
  if (cat === '4-6') return '4-6 Players Category';
  if (cat === '7+') return '7+ Players Category';
  return `${cat} Players Category`;
};
