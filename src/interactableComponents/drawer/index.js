import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {StyleSheet, Animated, View, TouchableOpacity, TouchableHighlight} from 'react-native';
import Interactable from 'react-native-interactable';
import {BaseComponent, Constants, Colors, Typography} from '../../../src';


const DEFAULT_HEIGHT = 72;
const ITEM_BG = {
  left: Colors.blue30,
  first: Colors.violet10,
  second: Colors.violet30,
  third: Colors.violet40,
};
const DEFAULT_ICON_SIZE = 24;
const MIN_LEFT_MARGIN = 28;
const ITEM_PADDING = 12;
const BLEED = 25;
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
     * The bottom layer's items to appear when opened from the right (max. 3 items)
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
    
    this.state = {
      inMotion: false,
      position: 1,
    };
  }

  componentWillReceiveProps(nextProps) { //eslint-disable-line
    this.deltaX = new Animated.Value(0);
    this.minItemWidth = this.getMinItemWidth();
    this.maxItemWidth = this.getMaxItemWidth();
    this.setState({inMotion: false, position: 1});
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
      const index = rightItems.length - numberOfItems || 0;
      for (let i = rightItems.length - 1; i >= index; i--) {
        total += this.getItemWidth(rightItems[i]);
      }
    }
    return total;
  }
  getLeftItemWidth() {
    const {leftItem} = this.props;
    const width = leftItem ? leftItem.width : undefined;
    return width || this.minItemWidth;
  }
  getItemWidth(item) {
    if (item && item.width && item.width <= this.maxItemWidth) {
      return item.width;
    }
    return this.minItemWidth;
  }

  getBoundaries() {
    const {leftItem, rightItems} = this.props;
    const rightWidth = this.getRightItemsTotalWidth();
    const size = rightItems ? rightItems.length : 0;
    
    const rightBound = rightWidth > 0 ? -rightWidth : -(this.minItemWidth * size);
    const dragBounds = {right: _.isEmpty(leftItem) ? 0 : this.getLeftItemWidth(), left: _.isEmpty(rightItems) ? 0 : rightBound};
    return dragBounds;
  }
  getSnapPoints() {
    const {leftItem, rightItems, damping, tension} = this.props;
    const size = rightItems ? rightItems.length : 0;
    
    const left = !_.isEmpty(leftItem) ? {x: this.getLeftItemWidth(), damping: 1 - damping, tension} : {};
    const initial = {x: 0, damping: 1 - damping, tension};
    const last = rightItems && !_.isEmpty(rightItems[0]) ?
      {x: -(this.getRightItemsTotalWidth()), damping: 1 - damping, tension} : {};

    switch (size) {
      case 1:
      case 2:
      case 3:
        return [left, initial, last];
      default:
        return [left, initial];
    }
  }
  getAlertAreas() {
    const {rightItems} = this.props;
    const size = rightItems ? rightItems.length : 0;
    const firstItem = rightItems ? rightItems[0] : undefined;
    
    const first = {id: 'first', influenceArea: {left: -(this.getItemWidth(firstItem) || this.minItemWidth)}};
    const second = {id: 'second', influenceArea: {left: -(this.getRightItemsTotalWidth(2))}};
    
    switch (size) {
      case 2:
        return [first];
      case 3:
        return [first, second];
      default:
        return [];
    }
  }
  getInputRanges() {
    const {rightItems} = this.props;
    const size = rightItems ? rightItems.length : 0;
    const end = this.minItemWidth - BLEED;
    const interval = 65;

    const first = [-(this.minItemWidth), -(end)];
    const second = [-(this.minItemWidth * 2), -(end + interval)];
    const third = [-(this.minItemWidth * 3), -(end + (interval * 2))];

    switch (size) {
      case 1:
        return [first];
      case 2:
        return [second, first];
      case 3:
        return [third, second, first];
      default:
        return [];
    }
  }

  renderLeftItem() {
    const {height, width, leftItem} = this.props;
    const leftItemWidth = this.getLeftItemWidth();
    const background = (leftItem ? leftItem.background : undefined) || ITEM_BG.left;
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
  renderRightItems() {
    const {height, rightItems} = this.props;
    const inputRanges = this.getInputRanges();

    return (
      <View style={{position: 'absolute', right: 0, height, flexDirection: 'row', alignItems: 'center'}}>
        
        {rightItems[0] && 
          <TouchableOpacity
            style={[
              this.styles.button, {
                width: rightItems[0].width,
                minWidth: this.minItemWidth,
                maxWidth: this.maxItemWidth,
                backgroundColor: rightItems[0].background || ITEM_BG.first,
              },
            ]}
            onPress={rightItems[0].onPress}
            activeOpacity={rightItems[0].onPress ? 0.7 : 1}
          >
            {rightItems[0].icon &&
            <Animated.Image
              source={rightItems[0].icon}
              style={
              [this.styles.buttonImage, {
                opacity: this.deltaX.interpolate({
                  inputRange: inputRanges[0],
                  outputRange: [1, 0],
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
                transform: [{
                  scale: this.deltaX.interpolate({
                    inputRange: inputRanges[0],
                    outputRange: [1, 0.7],
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                }],
              },
              ]}
            />}
            {rightItems[0].text && 
            <Animated.Text
              numberOfLines={1}
              style={
              [this.styles.buttonText, {
                opacity: this.deltaX.interpolate({
                  inputRange: inputRanges[0],
                  outputRange: [1, 0],
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
                transform: [{
                  scale: this.deltaX.interpolate({
                    inputRange: inputRanges[0],
                    outputRange: [1, 0.7],
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                }],
              },
              ]}
            >
              {rightItems[0].text}
            </Animated.Text>}
          </TouchableOpacity>}
        
        {rightItems[1] && 
        <TouchableOpacity
          style={[
            this.styles.button, {
              width: rightItems[1].width,
              minWidth: this.minItemWidth,
              maxWidth: this.maxItemWidth,
              backgroundColor: rightItems[1].background || ITEM_BG.second,
            },
          ]}
          onPress={rightItems[1].onPress}
          activeOpacity={rightItems[1].onPress ? 0.7 : 1}
        >
          {rightItems[1].icon && <Animated.Image
            source={rightItems[1].icon}
            style={
            [this.styles.buttonImage, {
              opacity: this.deltaX.interpolate({
                inputRange: inputRanges[1],
                outputRange: [1, 0],
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              transform: [{
                scale: this.deltaX.interpolate({
                  inputRange: inputRanges[1],
                  outputRange: [1, 0.7],
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }],
            },
            ]}
          />}
          {rightItems[1].text && 
          <Animated.Text
            numberOfLines={1}
            style={
            [this.styles.buttonText, {
              opacity: this.deltaX.interpolate({
                inputRange: inputRanges[1],
                outputRange: [1, 0],
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              transform: [{
                scale: this.deltaX.interpolate({
                  inputRange: inputRanges[1],
                  outputRange: [1, 0.7],
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }],
            },
            ]}
          >
            {rightItems[1].text}
          </Animated.Text>}
        </TouchableOpacity>}
        
        {rightItems[2] && 
        <TouchableOpacity
          style={[
            this.styles.button, {
              width: rightItems[2].width,
              minWidth: this.minItemWidth,
              maxWidth: this.maxItemWidth,
              backgroundColor: rightItems[2].background || ITEM_BG.third,
            },
          ]}
          onPress={rightItems[2].onPress}
          activeOpacity={rightItems[2].onPress ? 0.7 : 1}
        >
          {rightItems[2].icon && <Animated.Image
            source={rightItems[2].icon}
            style={
            [this.styles.buttonImage, {
              opacity: this.deltaX.interpolate({
                inputRange: inputRanges[2],
                outputRange: [1, 0],
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              transform: [{
                scale: this.deltaX.interpolate({
                  inputRange: inputRanges[2],
                  outputRange: [1, 0.7],
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }],
            },
            ]}
          />}
          {rightItems[2].text && 
          <Animated.Text
            numberOfLines={1}
            style={
            [this.styles.buttonText, {
              opacity: this.deltaX.interpolate({
                inputRange: inputRanges[2],
                outputRange: [1, 0],
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              transform: [{
                scale: this.deltaX.interpolate({
                  inputRange: inputRanges[2],
                  outputRange: [1, 0.7],
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }],
            },
            ]}
          >
            {rightItems[2].text}
          </Animated.Text>}
        </TouchableOpacity>}
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
