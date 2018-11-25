import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {StyleSheet, Animated, View, TouchableOpacity, TouchableHighlight} from 'react-native';
import Interactable from 'react-native-interactable';
import {BaseComponent, Constants, Colors, Typography} from '../../../src';


const DEFAULT_HEIGHT = 72;
const MIN_LEFT_MARGIN = 28;
const DEFAULT_ICON_SIZE = 24;
const ITEM_BG = Colors.blue30;
const ITEM_PADDING = 12;
const BLEED = 15;
const ITEM_PROP_TYPES = {
  width: PropTypes.number,
  background: PropTypes.string,
  text: PropTypes.string,
  icon: PropTypes.number,
  onPress: PropTypes.func,
};

/**
 * @description: Interactable Drawer component
 * @extendslink: 
 */
export default class Drawer extends BaseComponent {
  static displayName = 'Drawer';

  static propTypes = {
    /**
     * The drawer's height
     */
    height: PropTypes.number.isRequired,
    /**
     * The drawer's width
     */
    width: PropTypes.number,
    /**
     * The drawer top layer's damping
     */
    damping: PropTypes.number,
    /**
     * The drawer top layer's tention
     */
    tension: PropTypes.number,
    /**
     * The bottom layer's items to appear when opened from the right
     */
    rightItems: PropTypes.arrayOf(PropTypes.shape(ITEM_PROP_TYPES)),
    /**
     * The bottom layer's item to appear when opened from the left (a single item)
     */
    leftItem: PropTypes.shape(ITEM_PROP_TYPES),
    /**
     * The color for the text and icon tint of the items
     */
    itemsTintColor: PropTypes.string,
    /**
     * The items' icon size
     */
    itemsIconSize: PropTypes.number,
    /**
     * The items' text style
     */
    itemsTextStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    /**
     * Press handler (will also close the drawer)
     */
    onPress: PropTypes.func,
  };

  static defaultProps = {
    height: DEFAULT_HEIGHT,
    width: Constants.screenWidth,
    damping: 1 - 0.6,
    tension: 300,
    itemsTintColor: Colors.white,
    itemsIconSize: DEFAULT_ICON_SIZE,
  }

  constructor(props) {
    super(props);

    this.deltaX = new Animated.Value(0);
    this.minItemWidth = this.getMinItemWidth();
    this.maxItemWidth = this.getMaxItemWidth();
    this.inputRanges = this.getInputRanges();
    
    this.state = {
      inMotion: false,
      position: 1,
    };
  }

  componentWillReceiveProps(nextProps) { //eslint-disable-line
    if (nextProps !== this.props) {
      this.deltaX = new Animated.Value(0);
      this.minItemWidth = this.getMinItemWidth();
      this.maxItemWidth = this.getMaxItemWidth();
      this.inputRanges = this.getInputRanges();

      this.setState({inMotion: false, position: 1});
    }
  }

  onAlert = ({nativeEvent}) => {
    const event = JSON.stringify(nativeEvent);

    if (event.includes('"first":"leave"')) {
      this.interactableElem.snapTo({index: 2});
    }
    if (event.includes('"second":"enter"')) {
      this.interactableElem.snapTo({index: 1});
    }
  }
  onSnap = ({nativeEvent}) => {
    const {index} = nativeEvent;
    this.setState({position: index});
  }
  onDrag = ({nativeEvent}) => {
    const {state} = nativeEvent;
    if (state === 'start') {
      this.setState({inMotion: true});
    }
  }
  onStop = () => {
    this.setState({inMotion: false});
  }
  onPress = () => {
    this.closeDrawer();
    setTimeout(() => {
      _.invoke(this.props, 'onPress');
    }, 0);
  }

  closeDrawer() {
    const {inMotion, position} = this.state;
    if (!inMotion && position !== 1) {
      this.interactableElem.snapTo({index: 1});
    }
  }

  generateStyles() {
    this.styles = createStyles(this.props);
  }

  getMinItemWidth() {
    const {height} = this.props;
    const maxWidth = this.getMaxItemWidth();
    return (height > maxWidth) ? maxWidth : height;
  }
  getMaxItemWidth() {
    const {rightItems, width} = this.props;
    return rightItems ? (width - MIN_LEFT_MARGIN) / rightItems.length : (width - MIN_LEFT_MARGIN);
  }
  getRightItemsTotalWidth(numberOfItems) {
    const {rightItems} = this.props;
    let total = 0;

    if (rightItems && rightItems.length > 0) {
      const items = rightItems.reverse();
      const size = numberOfItems && numberOfItems >= 0 ? numberOfItems : items.length;
      
      for (let i = 0; i < size; i++) {
        total += this.getItemWidth(items[i]);
      }
    }
    return total;
  }
  getItemWidth(item) {
    if (item && item.width) {
      if (item.width <= this.minItemWidth) {
        return this.minItemWidth;
      }
      if (item.width >= this.maxItemWidth) {
        return this.maxItemWidth;
      }
      return item.width;
    }
    return this.minItemWidth;
  }

  getBoundaries() {
    const {leftItem, rightItems} = this.props;
    const rightWidth = this.getRightItemsTotalWidth();
    const size = rightItems ? rightItems.length : 0;
    
    const rightBound = rightWidth > 0 ? -rightWidth : -(this.minItemWidth * size);
    return {right: _.isEmpty(leftItem) ? 0 : this.getItemWidth(leftItem), left: _.isEmpty(rightItems) ? 0 : rightBound};
  }
  getSnapPoints() {
    const {leftItem, rightItems, damping, tension} = this.props;
    const size = rightItems ? rightItems.length : 0;
    
    const left = !_.isEmpty(leftItem) ? {x: this.getItemWidth(leftItem), damping: 1 - damping, tension} : {};
    const initial = {x: 0, damping: 1 - damping, tension};
    const last = rightItems && !_.isEmpty(rightItems[0]) ?
      {x: -(this.getRightItemsTotalWidth()), damping: 1 - damping, tension} : {};

    switch (size) {
      case 0: 
        return [left, initial];
      default:
        return [left, initial, last];
    }
  }
  getAlertAreas() {
    const {rightItems} = this.props;
    const size = rightItems ? rightItems.length : 0;

    const first = {id: 'first', influenceArea: {left: -(this.getRightItemsTotalWidth(1))}};
    const second = {id: 'second', influenceArea: {left: -(this.getRightItemsTotalWidth(size - 1))}};
    
    switch (size) {
      case 0: 
      case 1:
        return [];
      case 2:
        return [first];
      default:
        return [first, second];
    }
  }
  getInputRanges() {
    const {rightItems} = this.props;
    const size = rightItems ? rightItems.length : 0;
    const interval = 65;
    const inputRanges = [];
    
    for (let i = 0; i < size; i++) {
      const itemWidth = this.getItemWidth(rightItems[i]);
      const end = itemWidth - (size * BLEED);
      const min = -(itemWidth * (i + 1));
      const max = -(end + (interval * i));
      // const range = [-(this.minItemWidth * (i + 1)), -(end + (interval * i))];
      inputRanges.push([min, max]);
    }
    return inputRanges.reverse();
  }

  renderLeftItem() {
    const {height, width, leftItem} = this.props;
    const leftItemWidth = this.getItemWidth(leftItem);
    const background = (leftItem ? leftItem.background : undefined) || ITEM_BG;
    const onLeftPress = leftItem ? leftItem.onPress : undefined;

    return (
      <View
        style={{position: 'absolute', left: 0, right: width / 2, flexDirection: 'row'}}
        pointerEvents={'box-none'}
      >
        <Animated.View
          style={{
            backgroundColor: background,
            position: 'absolute',
            left: 0,
            right: 0,
            transform: [{
              translateX: this.deltaX.interpolate({
                inputRange: [0, leftItemWidth],
                outputRange: [-leftItemWidth, 0],
                extrapolateRight: 'clamp',
              }),
            }],
          }}
        >
          <TouchableHighlight
            onPress={onLeftPress}
            underlayColor={Colors.getColorTint(background, 50)}
          >
            <View
              style={{
                width: leftItemWidth,
                minWidth: this.minItemWidth,
                maxWidth: this.maxItemWidth,
                height,
                padding: ITEM_PADDING,
                justifyContent: 'center',
                alignItems: 'center',
              }} 
            >
              {leftItem && leftItem.icon &&
              <Animated.Image
                source={leftItem.icon}
                style={
                [this.styles.buttonImage, {
                  opacity: this.deltaX.interpolate({
                    inputRange: [leftItemWidth - BLEED, leftItemWidth],
                    outputRange: [0, 1],
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                  transform: [{
                    scale: this.deltaX.interpolate({
                      inputRange: [leftItemWidth - BLEED, leftItemWidth],
                      outputRange: [0.7, 1],
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    }),
                  }],
                },
                ]}
              />}
              {leftItem && leftItem.text && 
              <Animated.Text
                numberOfLines={1}
                style={
                [this.styles.buttonText, {
                  opacity: this.deltaX.interpolate({
                    inputRange: [leftItemWidth - BLEED, leftItemWidth],
                    outputRange: [0, 1],
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                  transform: [{
                    scale: this.deltaX.interpolate({
                      inputRange: [leftItemWidth - BLEED, leftItemWidth],
                      outputRange: [0.7, 1],
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    }),
                  }],
                },
                ]}
              >
                {leftItem.text}
              </Animated.Text>}
            </View>
          </TouchableHighlight>
        </Animated.View>
      </View>
    );
  }
  renderRightItem(item, index) {
    return (
      <TouchableOpacity
        key={index}
        style={[
          this.styles.button, {
            width: this.getItemWidth(item),
            minWidth: this.minItemWidth,
            maxWidth: this.maxItemWidth,
            backgroundColor: item.background || ITEM_BG,
          },
        ]}
        onPress={item.onPress}
        activeOpacity={item.onPress ? 0.7 : 1}
      >
        {item.icon &&
        <Animated.Image
          source={item.icon}
          style={
          [this.styles.buttonImage, {
            opacity: this.deltaX.interpolate({
              inputRange: this.inputRanges[index],
              outputRange: [1, 0],
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: [{
              scale: this.deltaX.interpolate({
                inputRange: this.inputRanges[index],
                outputRange: [1, 0.7],
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }],
          },
          ]}
        />}
        {item.text && 
        <Animated.Text
          numberOfLines={1}
          style={
          [this.styles.buttonText, {
            opacity: this.deltaX.interpolate({
              inputRange: this.inputRanges[index],
              outputRange: [1, 0],
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: [{
              scale: this.deltaX.interpolate({
                inputRange: this.inputRanges[index],
                outputRange: [1, 0.7],
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }],
          },
          ]}
        >
          {item.text}
        </Animated.Text>}
      </TouchableOpacity>
    );
  }
  renderRightItems() {
    const {height, rightItems} = this.props;

    return (
      <View style={{position: 'absolute', right: 0, height, flexDirection: 'row'}}>
        {_.map(rightItems, (item, index) => { return this.renderRightItem(item, index); })}
      </View>
    );
  }
  render() {
    const {style, height, width, onPress, rightItems} = this.props;
    const Container = onPress ? TouchableOpacity : View;

    return (
      <View style={[style, this.styles.container, {width}]}>
        {rightItems && this.renderRightItems()}
        {this.renderLeftItem()}
        <Interactable.View
          ref={el => this.interactableElem = el}
          horizontalOnly
          boundaries={this.getBoundaries()}
          snapPoints={this.getSnapPoints()}
          alertAreas={this.getAlertAreas()}
          onAlert={this.onAlert}
          onSnap={this.onSnap}
          onDrag={this.onDrag}
          onStop={this.onStop}
          dragToss={0.01}
          animatedValueX={this.deltaX}
          style={{backgroundColor: Colors.white}}
        >
          <Container onPress={this.onPress} activeOpacity={0.7}>
            <View style={{left: 0, right: 0, height}}>
              {this.props.children}
            </View>
          </Container>
        </Interactable.View>
      </View>
    );
  }
}

function createStyles(props) {
  const {height, itemsTintColor, itemsIconSize, itemsTextStyle} = props;
  const typography = height >= DEFAULT_HEIGHT ? Typography.text70 : Typography.text80;
  const textTopMargin = height > DEFAULT_HEIGHT ? 8 : 0;
  const buttonPadding = height >= DEFAULT_HEIGHT ? ITEM_PADDING : 8;

  return StyleSheet.create({
    container: {
      overflow: 'hidden',
    },
    button: {
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      padding: buttonPadding,
    },
    buttonImage: {
      width: itemsIconSize,
      height: itemsIconSize,
      tintColor: itemsTintColor,
    },
    buttonText: {
      ...typography,
      color: itemsTintColor,
      marginTop: textTopMargin,
      ...itemsTextStyle,
    },
  });
}
